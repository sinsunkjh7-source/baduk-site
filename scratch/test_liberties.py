# Test group and liberty calculation
def get_stone_groups(board, cols, rows):
    visited = [[False]*cols for _ in range(rows)]
    groups = []
    for y in range(rows):
        for x in range(cols):
            color = board[y][x]
            if color != 0 and not visited[y][x]:
                stones = []
                liberties = set()
                queue = [(x, y)]
                visited[y][x] = True
                while queue:
                    cx, cy = queue.pop(0)
                    stones.append((cx, cy))
                    for nx, ny in [(cx+1, cy), (cx-1, cy), (cx, cy+1), (cx, cy-1)]:
                        if 0 <= nx < cols and 0 <= ny < rows:
                            if board[ny][nx] == 0:
                                liberties.add((nx, ny))
                            elif board[ny][nx] == color and not visited[ny][nx]:
                                visited[ny][nx] = True
                                queue.append((nx, ny))
                groups.append({'color': color, 'stones': stones, 'liberties': len(liberties)})
    return groups

board = [[0]*10 for _ in range(9)]
# Put white stone at (6, 5) with black stones at (6, 4), (6, 6), (5, 5) -> White has 1 liberty at (7, 5) (Atari!)
board[5][6] = 2
board[4][6] = 1
board[6][6] = 1
board[5][5] = 1

groups = get_stone_groups(board, 10, 9)
for g in groups:
    print(g)
