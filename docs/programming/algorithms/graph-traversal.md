# Graph Traversal

| ![Edge Type](@assets/img/algorithms/graph/edges.jpg) |
| :--------------------------------------------------: |
|               _Types of Edges_[^edges]               |

[^edges]: Image is from <https://www.geeksforgeeks.org/tarjan-algorithm-find-strongly-connected-components/>

|                Item                |           DFS            |           BFS            |
| :--------------------------------: | :----------------------: | :----------------------: |
|           Data Structure           |          Stack           |          Queue           |
|            Vertex Order            |       one sequence       |      two sequences       |
|    Edge Type (Undirected Graph)    |   tree edge, back edge   |  tree edge, cross edge   |
| Time Complexity (Adjacency Matrix) |    $O({ \| V \| }^2)$    |    $O({ \| V \| }^2)$    |
|  Time Complexity (Adjacency List)  | $O( \| V \| + \| E \| )$ | $O( \| V \| + \| E \| )$ |
|    Worst-case Space Complexity     |      $O( \| V \|)$       |      $O( \| V \|)$       |

Example

![Graph](@assets/img/algorithms/graph/graph.png)

Adjacency Matrix

|                                         |                0                 |                1                 |                2                 |                3                 |                4                 |                5                 |                6                 |
| :-------------------------------------: | :------------------------------: | :------------------------------: | :------------------------------: | :------------------------------: | :------------------------------: | :------------------------------: | :------------------------------: |
| <span style="font-weight:bold">0</span> |                0                 | <span style="color:red">1</span> | <span style="color:red">1</span> |                0                 |                0                 |                0                 |                0                 |
| <span style="font-weight:bold">1</span> | <span style="color:red">1</span> |                0                 | <span style="color:red">1</span> | <span style="color:red">1</span> |                0                 |                0                 |                0                 |
| <span style="font-weight:bold">2</span> | <span style="color:red">1</span> | <span style="color:red">1</span> |                0                 |                0                 | <span style="color:red">1</span> |                0                 |                0                 |
| <span style="font-weight:bold">3</span> |                0                 | <span style="color:red">1</span> |                0                 |                0                 | <span style="color:red">1</span> |                0                 |                0                 |
| <span style="font-weight:bold">4</span> |                0                 |                0                 | <span style="color:red">1</span> | <span style="color:red">1</span> |                0                 | <span style="color:red">1</span> |                0                 |
| <span style="font-weight:bold">5</span> |                0                 |                0                 |                0                 |                0                 | <span style="color:red">1</span> |                0                 | <span style="color:red">1</span> |
| <span style="font-weight:bold">6</span> |                0                 |                0                 |                0                 |                0                 |                0                 | <span style="color:red">1</span> |                0                 |

Adjacency List

- 0: 1 -> 2
- 1: 0 -> 2 -> 3
- 2: 0 -> 1 -> 4
- 3: 1 -> 4
- 4: 2 -> 3 -> 5
- 5: 4 -> 6
- 6: 5

## DFS

```py
def dfs(matrix):
    # taking adjacency matrix
    stack = [0]
    visited = set()
    visited.add(0)
    while stack:
        cur = stack.pop()
        # do something
        print(cur)
        for i, adj in enumerate(matrix[cur]):
            if adj and i not in visited:
                visited.add(i)
                stack.append(i)
```

## BFS

```py
from collections import deque

def bfs(lists):
    # taking adjacency list
    q = deque([0])
    visited = [False] * len(lists)
    visited[0] = True
    while q:
        cur = q.popleft()
        # do something
        print(cur)
        for i in lists[cur]:
            if not visited[i]:
                visited[i] = True
                q.append(i)
```

## Level Order Traversal

```py
from collections import deque

def lot(lists) -> int:
    # taking adjacency list
    q = deque([0])
    visited = [False] * len(lists)
    visited[0] = True
    lv = 0
    while q:
        lv += 1
        print(f'level {lv}')
        for _ in range(len(q)):
            cur = q.popleft()
            # do something
            print(cur)
            for i in lists[cur]:
                if not visited[i]:
                    visited[i] = True
                    q.append(i)
    return lv
```

## Tests

<iframe height="600px" width="100%" src="https://repl.it/@LucienZhang/graph-traversal?lite=true" scrolling="no" frameborder="no" allowtransparency="true" allowfullscreen="true" sandbox="allow-forms allow-pointer-lock allow-popups allow-same-origin allow-scripts allow-modals" loading="lazy"></iframe>
