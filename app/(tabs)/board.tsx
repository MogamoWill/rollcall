import { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  Animated,
  PanResponder,
  Dimensions,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useBoardStore } from "@/stores/boardStore";
import type { BoardCard, BoardColumn } from "@/types";

const SCREEN_WIDTH = Dimensions.get("window").width;
const COLUMN_WIDTH = SCREEN_WIDTH * 0.75;

export default function BoardScreen() {
  const {
    boards,
    currentBoard,
    loading,
    fetchBoards,
    createBoard,
    setCurrentBoard,
    addCard,
    moveCard,
    deleteCard,
  } = useBoardStore();

  const [showNewBoard, setShowNewBoard] = useState(false);
  const [showNewCard, setShowNewCard] = useState<string | null>(null);
  const [newBoardName, setNewBoardName] = useState("");
  const [newCardTitle, setNewCardTitle] = useState("");
  const [newCardDescription, setNewCardDescription] = useState("");
  const [draggedCard, setDraggedCard] = useState<BoardCard | null>(null);

  useEffect(() => {
    fetchBoards().catch(() => {});
  }, [fetchBoards]);

  useEffect(() => {
    if (boards.length > 0 && !currentBoard) {
      setCurrentBoard(boards[0]);
    }
  }, [boards, currentBoard, setCurrentBoard]);

  const handleCreateBoard = async () => {
    if (!newBoardName) return;
    try {
      const board = await createBoard(newBoardName);
      setCurrentBoard(board);
      setShowNewBoard(false);
      setNewBoardName("");
    } catch {
      Alert.alert("Erreur", "Impossible de créer le board");
    }
  };

  const handleAddCard = async () => {
    if (!newCardTitle || !showNewCard) return;
    try {
      await addCard(showNewCard, {
        column_id: showNewCard,
        title: newCardTitle,
        description: newCardDescription || undefined,
        labels: [],
      });
      setShowNewCard(null);
      setNewCardTitle("");
      setNewCardDescription("");
      // Refresh board
      await fetchBoards();
      const updated = useBoardStore
        .getState()
        .boards.find((b) => b.id === currentBoard?.id);
      if (updated) setCurrentBoard(updated);
    } catch {
      Alert.alert("Erreur", "Impossible d'ajouter la carte");
    }
  };

  const handleMoveCard = async (
    card: BoardCard,
    direction: "left" | "right"
  ) => {
    if (!currentBoard) return;
    const columns = currentBoard.columns ?? [];
    const currentColIndex = columns.findIndex((c) => c.id === card.column_id);
    const targetColIndex =
      direction === "left" ? currentColIndex - 1 : currentColIndex + 1;

    if (targetColIndex < 0 || targetColIndex >= columns.length) return;

    const targetColumn = columns[targetColIndex];
    try {
      await moveCard(card.id, targetColumn.id, targetColumn.cards?.length ?? 0);
      await fetchBoards();
      const updated = useBoardStore
        .getState()
        .boards.find((b) => b.id === currentBoard.id);
      if (updated) setCurrentBoard(updated);
    } catch {
      Alert.alert("Erreur", "Impossible de déplacer la carte");
    }
  };

  const handleDeleteCard = (card: BoardCard) => {
    Alert.alert("Supprimer", `Supprimer "${card.title}" ?`, [
      { text: "Annuler", style: "cancel" },
      {
        text: "Supprimer",
        style: "destructive",
        onPress: async () => {
          await deleteCard(card.id);
          await fetchBoards();
          const updated = useBoardStore
            .getState()
            .boards.find((b) => b.id === currentBoard?.id);
          if (updated) setCurrentBoard(updated);
        },
      },
    ]);
  };

  if (loading && boards.length === 0) {
    return (
      <View className="flex-1 bg-slate-50 items-center justify-center">
        <Text className="text-slate-400">Chargement...</Text>
      </View>
    );
  }

  if (boards.length === 0) {
    return (
      <View className="flex-1 bg-slate-50 items-center justify-center px-8">
        <Feather name="columns" size={48} color="#CBD5E1" />
        <Text className="text-xl font-bold text-slate-900 mt-4">
          Aucun board
        </Text>
        <Text className="text-slate-500 text-center mt-2 mb-6">
          Crée ton premier board Kanban pour organiser tes projets
        </Text>
        <TouchableOpacity
          className="bg-brand-500 px-6 py-3 rounded-xl"
          onPress={() => setShowNewBoard(true)}
        >
          <Text className="text-white font-semibold">Créer un board</Text>
        </TouchableOpacity>

        <Modal visible={showNewBoard} transparent animationType="fade">
          <View className="flex-1 bg-black/50 justify-center px-8">
            <View className="bg-white rounded-2xl p-6">
              <Text className="text-lg font-bold text-slate-900 mb-4">
                Nouveau board
              </Text>
              <TextInput
                className="border border-slate-200 rounded-xl px-4 py-3 text-base bg-slate-50 mb-4"
                placeholder="Nom du board"
                placeholderTextColor="#94A3B8"
                value={newBoardName}
                onChangeText={setNewBoardName}
                autoFocus
              />
              <View className="flex-row gap-3">
                <TouchableOpacity
                  className="flex-1 py-3 rounded-xl border border-slate-200 items-center"
                  onPress={() => setShowNewBoard(false)}
                >
                  <Text className="text-slate-700 font-medium">Annuler</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  className="flex-1 py-3 rounded-xl bg-brand-500 items-center"
                  onPress={handleCreateBoard}
                >
                  <Text className="text-white font-semibold">Créer</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-slate-50">
      {/* Board selector */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="max-h-14 px-4 pt-3"
      >
        {boards.map((board) => (
          <TouchableOpacity
            key={board.id}
            className={`mr-2 px-4 py-2 rounded-full ${
              currentBoard?.id === board.id
                ? "bg-brand-500"
                : "bg-white border border-slate-200"
            }`}
            onPress={() => setCurrentBoard(board)}
          >
            <Text
              className={`text-sm font-medium ${
                currentBoard?.id === board.id ? "text-white" : "text-slate-700"
              }`}
            >
              {board.name}
            </Text>
          </TouchableOpacity>
        ))}
        <TouchableOpacity
          className="px-4 py-2 rounded-full border border-dashed border-slate-300"
          onPress={() => setShowNewBoard(true)}
        >
          <Text className="text-sm text-slate-400">+ Board</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Kanban columns */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="flex-1 pt-4"
        pagingEnabled={false}
        snapToInterval={COLUMN_WIDTH + 12}
        decelerationRate="fast"
        contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}
      >
        {(currentBoard?.columns ?? []).map((column: BoardColumn, colIndex: number) => (
          <View
            key={column.id}
            className="bg-white rounded-2xl border border-slate-100"
            style={{ width: COLUMN_WIDTH }}
          >
            {/* Column header */}
            <View className="flex-row items-center px-4 pt-4 pb-2">
              <View
                className="w-3 h-3 rounded-full mr-2"
                style={{ backgroundColor: column.color }}
              />
              <Text className="text-base font-bold text-slate-900 flex-1">
                {column.name}
              </Text>
              <Text className="text-sm text-slate-400">
                {column.cards?.length ?? 0}
              </Text>
            </View>

            {/* Cards */}
            <ScrollView className="px-3 pb-3" style={{ maxHeight: 500 }}>
              {(column.cards ?? []).map((card: BoardCard) => (
                <View
                  key={card.id}
                  className="bg-slate-50 rounded-xl p-3 mb-2 border border-slate-100"
                >
                  <Text className="text-sm font-medium text-slate-900">
                    {card.title}
                  </Text>
                  {card.description && (
                    <Text className="text-xs text-slate-500 mt-1" numberOfLines={2}>
                      {card.description}
                    </Text>
                  )}
                  {card.due_date && (
                    <View className="flex-row items-center mt-2 gap-1">
                      <Feather name="calendar" size={10} color="#94A3B8" />
                      <Text className="text-xs text-slate-400">
                        {new Date(card.due_date).toLocaleDateString("fr-FR")}
                      </Text>
                    </View>
                  )}

                  {/* Move buttons */}
                  <View className="flex-row justify-between mt-2 pt-2 border-t border-slate-100">
                    <TouchableOpacity
                      className="p-1"
                      onPress={() => handleMoveCard(card, "left")}
                      disabled={colIndex === 0}
                    >
                      <Feather
                        name="chevron-left"
                        size={16}
                        color={colIndex === 0 ? "#E2E8F0" : "#64748B"}
                      />
                    </TouchableOpacity>
                    <TouchableOpacity
                      className="p-1"
                      onPress={() => handleDeleteCard(card)}
                    >
                      <Feather name="trash-2" size={14} color="#EF4444" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      className="p-1"
                      onPress={() => handleMoveCard(card, "right")}
                      disabled={
                        colIndex ===
                        (currentBoard?.columns ?? []).length - 1
                      }
                    >
                      <Feather
                        name="chevron-right"
                        size={16}
                        color={
                          colIndex ===
                          (currentBoard?.columns ?? []).length - 1
                            ? "#E2E8F0"
                            : "#64748B"
                        }
                      />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}

              {/* Add card button */}
              <TouchableOpacity
                className="border border-dashed border-slate-200 rounded-xl p-3 items-center"
                onPress={() => setShowNewCard(column.id)}
              >
                <Feather name="plus" size={16} color="#94A3B8" />
                <Text className="text-xs text-slate-400 mt-1">
                  Ajouter une carte
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        ))}
      </ScrollView>

      {/* New card modal */}
      <Modal visible={!!showNewCard} transparent animationType="fade">
        <View className="flex-1 bg-black/50 justify-center px-8">
          <View className="bg-white rounded-2xl p-6">
            <Text className="text-lg font-bold text-slate-900 mb-4">
              Nouvelle carte
            </Text>
            <TextInput
              className="border border-slate-200 rounded-xl px-4 py-3 text-base bg-slate-50 mb-3"
              placeholder="Titre"
              placeholderTextColor="#94A3B8"
              value={newCardTitle}
              onChangeText={setNewCardTitle}
              autoFocus
            />
            <TextInput
              className="border border-slate-200 rounded-xl px-4 py-3 text-base bg-slate-50 mb-4"
              placeholder="Description (optionnel)"
              placeholderTextColor="#94A3B8"
              value={newCardDescription}
              onChangeText={setNewCardDescription}
              multiline
            />
            <View className="flex-row gap-3">
              <TouchableOpacity
                className="flex-1 py-3 rounded-xl border border-slate-200 items-center"
                onPress={() => {
                  setShowNewCard(null);
                  setNewCardTitle("");
                  setNewCardDescription("");
                }}
              >
                <Text className="text-slate-700 font-medium">Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="flex-1 py-3 rounded-xl bg-brand-500 items-center"
                onPress={handleAddCard}
              >
                <Text className="text-white font-semibold">Ajouter</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* New board modal */}
      <Modal visible={showNewBoard} transparent animationType="fade">
        <View className="flex-1 bg-black/50 justify-center px-8">
          <View className="bg-white rounded-2xl p-6">
            <Text className="text-lg font-bold text-slate-900 mb-4">
              Nouveau board
            </Text>
            <TextInput
              className="border border-slate-200 rounded-xl px-4 py-3 text-base bg-slate-50 mb-4"
              placeholder="Nom du board"
              placeholderTextColor="#94A3B8"
              value={newBoardName}
              onChangeText={setNewBoardName}
              autoFocus
            />
            <View className="flex-row gap-3">
              <TouchableOpacity
                className="flex-1 py-3 rounded-xl border border-slate-200 items-center"
                onPress={() => setShowNewBoard(false)}
              >
                <Text className="text-slate-700 font-medium">Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="flex-1 py-3 rounded-xl bg-brand-500 items-center"
                onPress={handleCreateBoard}
              >
                <Text className="text-white font-semibold">Créer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
