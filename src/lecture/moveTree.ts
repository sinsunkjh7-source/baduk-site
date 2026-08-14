import { createEmptyBoard, placeStone } from "../goban/boardLogic";
import type { NumberedPoint } from "../goban/Goban";
import type { Point, StoneColor } from "../goban/types";
import type { Annotation, MoveNode, MoveTreeState } from "./types";

function makeId(): string {
  return crypto.randomUUID();
}

export function createMoveTree(size: number): MoveTreeState {
  const rootId = makeId();
  const root: MoveNode = {
    id: rootId,
    parentId: null,
    move: null,
    board: createEmptyBoard(size),
    children: [],
    annotations: [],
  };
  return { size, nodes: { [rootId]: root }, rootId, currentId: rootId };
}

export function getPathToRoot(tree: MoveTreeState, nodeId: string): string[] {
  const path: string[] = [];
  let cur: string | null = nodeId;
  while (cur) {
    path.unshift(cur);
    cur = tree.nodes[cur].parentId;
  }
  return path;
}

export function getMoveNumber(tree: MoveTreeState, nodeId: string): number {
  return getPathToRoot(tree, nodeId).length - 1;
}

/** Follows the most-recently-added child at each step until a leaf is reached. */
export function getLineEnd(tree: MoveTreeState, nodeId: string): string {
  let cur = nodeId;
  while (tree.nodes[cur].children.length > 0) {
    const children = tree.nodes[cur].children;
    cur = children[children.length - 1];
  }
  return cur;
}

export function findChildByMove(
  tree: MoveTreeState,
  nodeId: string,
  point: Point,
  color: StoneColor
): string | undefined {
  return tree.nodes[nodeId].children.find((childId) => {
    const move = tree.nodes[childId].move;
    return move && move.point.x === point.x && move.point.y === point.y && move.color === color;
  });
}

/**
 * Play a move from the current node. If a child with the same move already exists, just
 * navigate to it instead of creating a duplicate branch. Illegal moves leave the tree unchanged.
 */
export function playMove(
  tree: MoveTreeState,
  point: Point,
  color: StoneColor,
  enforceRules: boolean
): MoveTreeState {
  const existingChildId = findChildByMove(tree, tree.currentId, point, color);
  if (existingChildId) {
    return { ...tree, currentId: existingChildId };
  }

  const currentNode = tree.nodes[tree.currentId];
  const result = placeStone(currentNode.board, point, color, enforceRules);
  if (!result.legal) return tree;

  const newId = makeId();
  const newNode: MoveNode = {
    id: newId,
    parentId: tree.currentId,
    move: { point, color, captures: result.captured },
    board: result.board,
    children: [],
    annotations: [],
  };

  return {
    ...tree,
    nodes: {
      ...tree.nodes,
      [tree.currentId]: { ...currentNode, children: [...currentNode.children, newId] },
      [newId]: newNode,
    },
    currentId: newId,
  };
}

export function goToNode(tree: MoveTreeState, nodeId: string): MoveTreeState {
  if (!tree.nodes[nodeId]) return tree;
  return { ...tree, currentId: nodeId };
}

export function undo(tree: MoveTreeState): MoveTreeState {
  const parentId = tree.nodes[tree.currentId].parentId;
  return parentId ? { ...tree, currentId: parentId } : tree;
}

export function redo(tree: MoveTreeState): MoveTreeState {
  const children = tree.nodes[tree.currentId].children;
  return children.length ? { ...tree, currentId: children[children.length - 1] } : tree;
}

export function goToStart(tree: MoveTreeState): MoveTreeState {
  return { ...tree, currentId: tree.rootId };
}

export function goToEnd(tree: MoveTreeState): MoveTreeState {
  return { ...tree, currentId: getLineEnd(tree, tree.currentId) };
}

/**
 * Jump to a move number along the "current line": the ancestor chain of currentId,
 * extended forward (via most-recently-added children) as far as the tree allows.
 */
export function jumpToMoveNumber(tree: MoveTreeState, moveNumber: number): MoveTreeState {
  if (moveNumber <= 0) return goToStart(tree);

  const ancestorPath = getPathToRoot(tree, tree.currentId);
  if (moveNumber < ancestorPath.length) {
    return { ...tree, currentId: ancestorPath[moveNumber] };
  }

  let cur = tree.currentId;
  let depth = ancestorPath.length - 1;
  while (depth < moveNumber) {
    const children = tree.nodes[cur].children;
    if (children.length === 0) break;
    cur = children[children.length - 1];
    depth += 1;
  }
  return { ...tree, currentId: cur };
}

/** Sibling branches at the same point in the tree as nodeId (including nodeId itself). */
export function getSiblings(tree: MoveTreeState, nodeId: string): string[] {
  const parentId = tree.nodes[nodeId].parentId;
  return parentId ? tree.nodes[parentId].children : [nodeId];
}

export function addAnnotation(tree: MoveTreeState, nodeId: string, annotation: Annotation): MoveTreeState {
  const node = tree.nodes[nodeId];
  return {
    ...tree,
    nodes: { ...tree.nodes, [nodeId]: { ...node, annotations: [...node.annotations, annotation] } },
  };
}

export function removeAnnotation(tree: MoveTreeState, nodeId: string, annotationId: string): MoveTreeState {
  const node = tree.nodes[nodeId];
  return {
    ...tree,
    nodes: {
      ...tree.nodes,
      [nodeId]: { ...node, annotations: node.annotations.filter((a) => a.id !== annotationId) },
    },
  };
}

export function clearAnnotations(tree: MoveTreeState, nodeId: string): MoveTreeState {
  const node = tree.nodes[nodeId];
  return { ...tree, nodes: { ...tree.nodes, [nodeId]: { ...node, annotations: [] } } };
}

/** Move numbers for stones still on the board, along the path from root to nodeId. */
export function getMoveNumbersAlongPath(tree: MoveTreeState, nodeId: string): NumberedPoint[] {
  const path = getPathToRoot(tree, nodeId).slice(1);
  const currentBoard = tree.nodes[nodeId].board;
  const byPoint = new Map<string, NumberedPoint>();
  path.forEach((id, idx) => {
    const { x, y } = tree.nodes[id].move!.point;
    byPoint.set(`${x},${y}`, { x, y, number: idx + 1 });
  });
  return [...byPoint.values()].filter((p) => currentBoard[p.y][p.x] !== null);
}
