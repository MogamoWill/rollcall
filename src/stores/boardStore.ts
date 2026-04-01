import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { supabase } from "@/lib/supabase";
import { zustandStorage } from "@/lib/storage";
import type { Board, BoardColumn, BoardCard } from "@/types";

interface BoardState {
  boards: Board[];
  currentBoard: Board | null;
  loading: boolean;
  fetchBoards: () => Promise<void>;
  createBoard: (name: string) => Promise<Board>;
  setCurrentBoard: (board: Board | null) => void;
  addColumn: (boardId: string, name: string, color: string) => Promise<void>;
  addCard: (columnId: string, card: Omit<BoardCard, "id" | "order">) => Promise<void>;
  moveCard: (cardId: string, toColumnId: string, newOrder: number) => Promise<void>;
  updateCard: (cardId: string, updates: Partial<BoardCard>) => Promise<void>;
  deleteCard: (cardId: string) => Promise<void>;
}

export const useBoardStore = create<BoardState>()(
  persist(
    (set, get) => ({
      boards: [],
      currentBoard: null,
      loading: false,

      fetchBoards: async () => {
        set({ loading: true });
        const { data, error } = await supabase
          .from("boards")
          .select("*, columns:board_columns(*, cards:board_cards(*))")
          .order("created_at", { ascending: false });
        if (error) throw error;

        const boards = (data ?? []).map((board: Board) => ({
          ...board,
          columns: (board.columns ?? [])
            .sort((a: BoardColumn, b: BoardColumn) => a.order - b.order)
            .map((col: BoardColumn) => ({
              ...col,
              cards: (col.cards ?? []).sort(
                (a: BoardCard, b: BoardCard) => a.order - b.order
              ),
            })),
        }));

        set({ boards, loading: false });
      },

      createBoard: async (name) => {
        const { data: board, error } = await supabase
          .from("boards")
          .insert({ name })
          .select()
          .single();
        if (error) throw error;

        // Create default columns
        const defaultColumns = [
          { board_id: board.id, name: "À faire", color: "#94A3B8", order: 0, user_id: board.user_id },
          { board_id: board.id, name: "En cours", color: "#3B82F6", order: 1, user_id: board.user_id },
          { board_id: board.id, name: "Review", color: "#F59E0B", order: 2, user_id: board.user_id },
          { board_id: board.id, name: "Terminé", color: "#22C55E", order: 3, user_id: board.user_id },
        ];

        const { data: columns, error: colError } = await supabase
          .from("board_columns")
          .insert(defaultColumns)
          .select();
        if (colError) throw colError;

        const fullBoard = {
          ...board,
          columns: (columns ?? []).map((c: BoardColumn) => ({ ...c, cards: [] })),
        };
        set((state) => ({ boards: [fullBoard, ...state.boards] }));
        return fullBoard;
      },

      setCurrentBoard: (board) => set({ currentBoard: board }),

      addColumn: async (boardId, name, color) => {
        const board = get().boards.find((b) => b.id === boardId);
        const order = board?.columns?.length ?? 0;

        const { data, error } = await supabase
          .from("board_columns")
          .insert({ board_id: boardId, name, color, order })
          .select()
          .single();
        if (error) throw error;

        set((state) => ({
          boards: state.boards.map((b) =>
            b.id === boardId
              ? { ...b, columns: [...(b.columns ?? []), { ...data, cards: [] }] }
              : b
          ),
        }));
      },

      addCard: async (columnId, card) => {
        const board = get().boards.find((b) =>
          b.columns?.some((c: BoardColumn) => c.id === columnId)
        );
        const column = board?.columns?.find(
          (c: BoardColumn) => c.id === columnId
        );
        const order = column?.cards?.length ?? 0;

        const { data, error } = await supabase
          .from("board_cards")
          .insert({ ...card, column_id: columnId, order })
          .select()
          .single();
        if (error) throw error;

        set((state) => ({
          boards: state.boards.map((b) => ({
            ...b,
            columns: (b.columns ?? []).map((c: BoardColumn) =>
              c.id === columnId
                ? { ...c, cards: [...(c.cards ?? []), data] }
                : c
            ),
          })),
        }));
      },

      moveCard: async (cardId, toColumnId, newOrder) => {
        const { error } = await supabase
          .from("board_cards")
          .update({ column_id: toColumnId, order: newOrder })
          .eq("id", cardId);
        if (error) throw error;

        set((state) => {
          let movedCard: BoardCard | undefined;

          const boards = state.boards.map((b) => ({
            ...b,
            columns: (b.columns ?? []).map((c: BoardColumn) => {
              const cardIndex = (c.cards ?? []).findIndex(
                (card: BoardCard) => card.id === cardId
              );
              if (cardIndex >= 0) {
                movedCard = (c.cards ?? [])[cardIndex];
                return {
                  ...c,
                  cards: (c.cards ?? []).filter(
                    (_: BoardCard, i: number) => i !== cardIndex
                  ),
                };
              }
              return c;
            }),
          }));

          if (movedCard) {
            return {
              boards: boards.map((b) => ({
                ...b,
                columns: (b.columns ?? []).map((c: BoardColumn) => {
                  if (c.id === toColumnId) {
                    const cards = [...(c.cards ?? [])];
                    cards.splice(newOrder, 0, {
                      ...movedCard!,
                      column_id: toColumnId,
                      order: newOrder,
                    });
                    return { ...c, cards };
                  }
                  return c;
                }),
              })),
            };
          }

          return { boards };
        });
      },

      updateCard: async (cardId, updates) => {
        const { error } = await supabase
          .from("board_cards")
          .update(updates)
          .eq("id", cardId);
        if (error) throw error;

        set((state) => ({
          boards: state.boards.map((b) => ({
            ...b,
            columns: (b.columns ?? []).map((c: BoardColumn) => ({
              ...c,
              cards: (c.cards ?? []).map((card: BoardCard) =>
                card.id === cardId ? { ...card, ...updates } : card
              ),
            })),
          })),
        }));
      },

      deleteCard: async (cardId) => {
        const { error } = await supabase
          .from("board_cards")
          .delete()
          .eq("id", cardId);
        if (error) throw error;

        set((state) => ({
          boards: state.boards.map((b) => ({
            ...b,
            columns: (b.columns ?? []).map((c: BoardColumn) => ({
              ...c,
              cards: (c.cards ?? []).filter(
                (card: BoardCard) => card.id !== cardId
              ),
            })),
          })),
        }));
      },
    }),
    {
      name: "rollcall-board",
      storage: createJSONStorage(() => zustandStorage),
      partialize: (state) => ({
        boards: state.boards,
        currentBoard: state.currentBoard,
      }),
    }
  )
);
