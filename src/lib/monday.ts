const MONDAY_API_URL = "https://api.monday.com/v2";

interface MondayConfig {
  apiKey: string;
}

interface MondayBoard {
  id: string;
  name: string;
  columns: { id: string; title: string; type: string }[];
  groups: { id: string; title: string; color: string }[];
}

interface MondayItem {
  id: string;
  name: string;
  group: { id: string; title: string };
  column_values: { id: string; text: string; value: string }[];
}

async function mondayQuery(apiKey: string, query: string, variables?: Record<string, unknown>) {
  const response = await fetch(MONDAY_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: apiKey,
    },
    body: JSON.stringify({ query, variables }),
  });

  if (!response.ok) {
    throw new Error(`Monday API error: ${response.status}`);
  }

  const result = await response.json();
  if (result.errors) {
    throw new Error(result.errors[0].message);
  }
  return result.data;
}

export async function fetchMondayBoards(config: MondayConfig): Promise<MondayBoard[]> {
  const data = await mondayQuery(
    config.apiKey,
    `query { boards(limit: 50) { id name columns { id title type } groups { id title color } } }`
  );
  return data.boards;
}

export async function fetchMondayItems(
  config: MondayConfig,
  boardId: string
): Promise<MondayItem[]> {
  const data = await mondayQuery(
    config.apiKey,
    `query ($boardId: [ID!]) { boards(ids: $boardId) { items_page(limit: 200) { items { id name group { id title } column_values { id text value } } } } }`,
    { boardId: [boardId] }
  );
  return data.boards[0]?.items_page?.items ?? [];
}

export async function createMondayItem(
  config: MondayConfig,
  boardId: string,
  groupId: string,
  itemName: string
): Promise<{ id: string }> {
  const data = await mondayQuery(
    config.apiKey,
    `mutation ($boardId: ID!, $groupId: String!, $itemName: String!) { create_item(board_id: $boardId, group_id: $groupId, item_name: $itemName) { id } }`,
    { boardId, groupId, itemName }
  );
  return data.create_item;
}

export async function updateMondayItemGroup(
  config: MondayConfig,
  itemId: string,
  groupId: string
): Promise<void> {
  await mondayQuery(
    config.apiKey,
    `mutation ($itemId: ID!, $groupId: String!) { move_item_to_group(item_id: $itemId, group_id: $groupId) { id } }`,
    { itemId, groupId }
  );
}
