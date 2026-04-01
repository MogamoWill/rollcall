import { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Dimensions,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { showAlert } from "@/lib/alert";
import { useBoardStore } from "@/stores/boardStore";
import type { BoardCard, BoardColumn } from "@/types";

const SCREEN_WIDTH = Dimensions.get("window").width;
const COLUMN_WIDTH = SCREEN_WIDTH * 0.72;

const COLUMN_COLORS: Record<string, string> = {
  "A faire": "#94A3B8",
  "En cours": "#3B82F6",
  Review: "#F59E0B",
  Termine: "#22C55E",
};

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
      showAlert("Erreur", "Impossible de creer le board");
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
      await fetchBoards();
      const updated = useBoardStore
        .getState()
        .boards.find((b) => b.id === currentBoard?.id);
      if (updated) setCurrentBoard(updated);
    } catch {
      showAlert("Erreur", "Impossible d'ajouter la carte");
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
      await moveCard(
        card.id,
        targetColumn.id,
        targetColumn.cards?.length ?? 0
      );
      await fetchBoards();
      const updated = useBoardStore
        .getState()
        .boards.find((b) => b.id === currentBoard.id);
      if (updated) setCurrentBoard(updated);
    } catch {
      showAlert("Erreur", "Impossible de deplacer la carte");
    }
  };

  const handleDeleteCard = (card: BoardCard) => {
    showAlert("Supprimer", `Supprimer "${card.title}" ?`, [
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
      <View
        className="flex-1 items-center justify-center"
        style={{ backgroundColor: "#0F172A" }}
      >
        <Text style={{ color: "#475569" }}>Chargement...</Text>
      </View>
    );
  }

  if (boards.length === 0) {
    return (
      <View
        className="flex-1 items-center justify-center px-8"
        style={{ backgroundColor: "#0F172A" }}
      >
        <View
          className="w-20 h-20 rounded-xl items-center justify-center mb-4"
          style={{ backgroundColor: "#1E293B" }}
        >
          <MaterialCommunityIcons
            name="view-column"
            size={40}
            color="#334155"
          />
        </View>
        <Text className="text-xl font-bold mt-2" style={{ color: "#F1F5F9" }}>
          Aucun board
        </Text>
        <Text
          className="text-center mt-2 mb-6"
          style={{ color: "#64748B" }}
        >
          Cree ton premier board Kanban pour organiser tes projets
        </Text>
        <TouchableOpacity
          className="px-6 py-3 rounded-xl"
          style={{ backgroundColor: "#E8A838" }}
          onPress={() => setShowNewBoard(true)}
          activeOpacity={0.8}
        >
          <Text className="font-bold" style={{ color: "#0F172A" }}>Créer un board</Text>
        </TouchableOpacity>

        {/* New board modal (same as below) */}
        <Modal visible={showNewBoard} transparent animationType="fade">
          <View
            className="flex-1 justify-center px-8"
            style={{ backgroundColor: "rgba(0,0,0,0.7)" }}
          >
            <View className="rounded-xl p-6" style={{ backgroundColor: "#1E293B" }}>
              <Text
                className="text-lg font-bold mb-4"
                style={{ color: "#F1F5F9" }}
              >
                Nouveau board
              </Text>
              <TextInput
                className="rounded-xl px-4 py-3 text-base mb-4"
                style={{
                  backgroundColor: "#0F172A",
                  borderWidth: 1,
                  borderColor: "#334155",
                  color: "#F1F5F9",
                }}
                placeholder="Nom du board"
                placeholderTextColor="#475569"
                value={newBoardName}
                onChangeText={setNewBoardName}
                autoFocus
              />
              <View className="flex-row" style={{ gap: 10 }}>
                <TouchableOpacity
                  className="flex-1 py-3 rounded-xl items-center"
                  style={{ borderWidth: 1, borderColor: "#334155" }}
                  onPress={() => setShowNewBoard(false)}
                >
                  <Text className="font-medium" style={{ color: "#94A3B8" }}>
                    Annuler
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  className="flex-1 py-3 rounded-xl items-center"
                  style={{ backgroundColor: "#E8A838" }}
                  onPress={handleCreateBoard}
                >
                  <Text className="font-bold" style={{ color: "#0F172A" }}>Créer</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    );
  }

  return (
    <View className="flex-1" style={{ backgroundColor: "#0F172A" }}>
      <View style={{ maxWidth: 1200, width: "100%", alignSelf: "center", flex: 1 }}>
      {/* Board selector */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="px-4 pt-3 pb-2"
        style={{ maxHeight: 52 }}
      >
        {boards.map((board) => {
          const isActive = currentBoard?.id === board.id;
          return (
            <TouchableOpacity
              key={board.id}
              className="mr-2 px-4 py-2 rounded-full"
              style={{
                backgroundColor: isActive ? "#E8A838" : "#1E293B",
                borderWidth: isActive ? 0 : 1,
                borderColor: "#334155",
              }}
              onPress={() => setCurrentBoard(board)}
            >
              <Text
                className="text-sm font-semibold"
                style={{ color: isActive ? "#FFFFFF" : "#94A3B8" }}
              >
                {board.name}
              </Text>
            </TouchableOpacity>
          );
        })}
        <TouchableOpacity
          className="px-4 py-2 rounded-full"
          style={{
            borderWidth: 1,
            borderStyle: "dashed",
            borderColor: "#334155",
          }}
          onPress={() => setShowNewBoard(true)}
        >
          <Text className="text-sm" style={{ color: "#475569" }}>
            + Board
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Kanban columns */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="flex-1 pt-3"
        pagingEnabled={false}
        snapToInterval={COLUMN_WIDTH + 12}
        decelerationRate="fast"
        contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}
      >
        {(currentBoard?.columns ?? []).map(
          (column: BoardColumn, colIndex: number) => {
            const colColor =
              COLUMN_COLORS[column.name] || column.color || "#94A3B8";
            return (
              <View
                key={column.id}
                className="rounded-xl"
                style={{
                  width: COLUMN_WIDTH,
                  backgroundColor: "#1E293B",
                  borderWidth: 1,
                  borderColor: "#334155",
                }}
              >
                {/* Column header */}
                <View className="flex-row items-center px-4 pt-4 pb-2">
                  <View
                    className="w-3 h-3 rounded-full mr-2"
                    style={{ backgroundColor: colColor }}
                  />
                  <Text
                    className="text-base font-bold flex-1"
                    style={{ color: "#F1F5F9" }}
                  >
                    {column.name}
                  </Text>
                  <View
                    className="px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: colColor + "20" }}
                  >
                    <Text
                      className="text-xs font-bold"
                      style={{ color: colColor }}
                    >
                      {column.cards?.length ?? 0}
                    </Text>
                  </View>
                </View>

                {/* Cards */}
                <ScrollView
                  className="px-3 pb-3"
                  style={{ maxHeight: 500 }}
                >
                  {(column.cards ?? []).map((card: BoardCard) => (
                    <View
                      key={card.id}
                      className="rounded-xl p-3 mb-2"
                      style={{
                        backgroundColor: "#0F172A",
                        borderWidth: 1,
                        borderColor: "#334155",
                      }}
                    >
                      <Text
                        className="text-sm font-semibold"
                        style={{ color: "#F1F5F9" }}
                      >
                        {card.title}
                      </Text>
                      {card.description && (
                        <Text
                          className="text-xs mt-1"
                          numberOfLines={2}
                          style={{ color: "#64748B" }}
                        >
                          {card.description}
                        </Text>
                      )}
                      {card.due_date && (
                        <View
                          className="flex-row items-center mt-2"
                          style={{ gap: 4 }}
                        >
                          <MaterialCommunityIcons
                            name="calendar-outline"
                            size={11}
                            color="#475569"
                          />
                          <Text
                            className="text-xs"
                            style={{ color: "#475569" }}
                          >
                            {new Date(card.due_date).toLocaleDateString(
                              "fr-FR"
                            )}
                          </Text>
                        </View>
                      )}

                      {/* Move buttons */}
                      <View
                        className="flex-row justify-between mt-2 pt-2"
                        style={{
                          borderTopWidth: 1,
                          borderTopColor: "#1E293B",
                        }}
                      >
                        <TouchableOpacity
                          className="p-1"
                          onPress={() => handleMoveCard(card, "left")}
                          disabled={colIndex === 0}
                        >
                          <MaterialCommunityIcons
                            name="chevron-left"
                            size={16}
                            color={colIndex === 0 ? "#1E293B" : "#64748B"}
                          />
                        </TouchableOpacity>
                        <TouchableOpacity
                          className="p-1"
                          onPress={() => handleDeleteCard(card)}
                        >
                          <MaterialCommunityIcons
                            name="delete-outline"
                            size={14}
                            color="#EF4444"
                          />
                        </TouchableOpacity>
                        <TouchableOpacity
                          className="p-1"
                          onPress={() => handleMoveCard(card, "right")}
                          disabled={
                            colIndex ===
                            (currentBoard?.columns ?? []).length - 1
                          }
                        >
                          <MaterialCommunityIcons
                            name="chevron-right"
                            size={16}
                            color={
                              colIndex ===
                              (currentBoard?.columns ?? []).length - 1
                                ? "#1E293B"
                                : "#64748B"
                            }
                          />
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}

                  {/* Add card button */}
                  <TouchableOpacity
                    className="rounded-xl p-3 items-center"
                    style={{
                      borderWidth: 1,
                      borderStyle: "dashed",
                      borderColor: "#334155",
                    }}
                    onPress={() => setShowNewCard(column.id)}
                  >
                    <MaterialCommunityIcons
                      name="plus"
                      size={16}
                      color="#475569"
                    />
                    <Text
                      className="text-xs mt-1"
                      style={{ color: "#475569" }}
                    >
                      Ajouter une carte
                    </Text>
                  </TouchableOpacity>
                </ScrollView>
              </View>
            );
          }
        )}
      </ScrollView>

      {/* New card modal */}
      <Modal visible={!!showNewCard} transparent animationType="fade">
        <View
          className="flex-1 justify-center px-8"
          style={{ backgroundColor: "rgba(0,0,0,0.7)" }}
        >
          <View className="rounded-xl p-6" style={{ backgroundColor: "#1E293B" }}>
            <Text
              className="text-lg font-bold mb-4"
              style={{ color: "#F1F5F9" }}
            >
              Nouvelle carte
            </Text>
            <TextInput
              className="rounded-xl px-4 py-3 text-base mb-3"
              style={{
                backgroundColor: "#0F172A",
                borderWidth: 1,
                borderColor: "#334155",
                color: "#F1F5F9",
              }}
              placeholder="Titre"
              placeholderTextColor="#475569"
              value={newCardTitle}
              onChangeText={setNewCardTitle}
              autoFocus
            />
            <TextInput
              className="rounded-xl px-4 py-3 text-base mb-4"
              style={{
                backgroundColor: "#0F172A",
                borderWidth: 1,
                borderColor: "#334155",
                color: "#F1F5F9",
              }}
              placeholder="Description (optionnel)"
              placeholderTextColor="#475569"
              value={newCardDescription}
              onChangeText={setNewCardDescription}
              multiline
            />
            <View className="flex-row" style={{ gap: 10 }}>
              <TouchableOpacity
                className="flex-1 py-3 rounded-xl items-center"
                style={{ borderWidth: 1, borderColor: "#334155" }}
                onPress={() => {
                  setShowNewCard(null);
                  setNewCardTitle("");
                  setNewCardDescription("");
                }}
              >
                <Text className="font-medium" style={{ color: "#94A3B8" }}>
                  Annuler
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="flex-1 py-3 rounded-xl items-center"
                style={{ backgroundColor: "#E8A838" }}
                onPress={handleAddCard}
              >
                <Text className="font-bold" style={{ color: "#0F172A" }}>Ajouter</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* New board modal */}
      <Modal visible={showNewBoard} transparent animationType="fade">
        <View
          className="flex-1 justify-center px-8"
          style={{ backgroundColor: "rgba(0,0,0,0.7)" }}
        >
          <View className="rounded-xl p-6" style={{ backgroundColor: "#1E293B", maxWidth: 420, width: "100%", alignSelf: "center" }}>
            <Text
              className="text-lg font-bold mb-4"
              style={{ color: "#F1F5F9" }}
            >
              Nouveau board
            </Text>
            <TextInput
              className="rounded-xl px-4 py-3 text-base mb-4"
              style={{
                backgroundColor: "#0F172A",
                borderWidth: 1,
                borderColor: "#334155",
                color: "#F1F5F9",
              }}
              placeholder="Nom du board"
              placeholderTextColor="#475569"
              value={newBoardName}
              onChangeText={setNewBoardName}
              autoFocus
            />
            <View className="flex-row" style={{ gap: 10 }}>
              <TouchableOpacity
                className="flex-1 py-3 rounded-xl items-center"
                style={{ borderWidth: 1, borderColor: "#334155" }}
                onPress={() => setShowNewBoard(false)}
              >
                <Text className="font-medium" style={{ color: "#94A3B8" }}>
                  Annuler
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="flex-1 py-3 rounded-xl items-center"
                style={{ backgroundColor: "#E8A838" }}
                onPress={handleCreateBoard}
              >
                <Text className="font-bold" style={{ color: "#0F172A" }}>Créer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      </View>
    </View>
  );
}
