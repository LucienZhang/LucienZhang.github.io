# Single-Source Shortest Paths

Example

![Graph](@assets/img/algorithms/graph/weighted-graph.png)

Adjacency Matrix

|                                         |                0                 |                1                 |                2                 |                3                 |                4                 |                5                 |                6                 |
| :-------------------------------------: | :------------------------------: | :------------------------------: | :------------------------------: | :------------------------------: | :------------------------------: | :------------------------------: | :------------------------------: |
| <span style="font-weight:bold">0</span> |                0                 | <span style="color:red">1</span> | <span style="color:red">3</span> |                0                 |                0                 |                0                 |                0                 |
| <span style="font-weight:bold">1</span> | <span style="color:red">1</span> |                0                 | <span style="color:red">1</span> | <span style="color:red">5</span> |                0                 |                0                 |                0                 |
| <span style="font-weight:bold">2</span> | <span style="color:red">3</span> | <span style="color:red">1</span> |                0                 |                0                 | <span style="color:red">1</span> |                0                 |                0                 |
| <span style="font-weight:bold">3</span> |                0                 | <span style="color:red">5</span> |                0                 |                0                 | <span style="color:red">2</span> |                0                 |                0                 |
| <span style="font-weight:bold">4</span> |                0                 |                0                 | <span style="color:red">1</span> | <span style="color:red">2</span> |                0                 | <span style="color:red">4</span> |                0                 |
| <span style="font-weight:bold">5</span> |                0                 |                0                 |                0                 |                0                 | <span style="color:red">4</span> |                0                 | <span style="color:red">2</span> |
| <span style="font-weight:bold">6</span> |                0                 |                0                 |                0                 |                0                 |                0                 | <span style="color:red">2</span> |                0                 |

## Dijkstra's Algorithm

Require non-negative weights

Time Complexity: $O((|E|+|V|) \log |V|)$ (use heap or priority queue) or $O(|E|+|V| \log |V|)$ (use Fibonacci heap min-priority queue)

:::: tabs

::: tab python

```py
from heapq import heappop, heappush

def dijkstra(matrix, source) -> dict:
    # optimized by heap
    h = [(0, source)]
    visited = {}
    while h and len(visited) < len(matrix):
        weight, cur = heappop(h)
        if cur in visited:
            continue
        visited[cur] = weight
        for i, w in enumerate(matrix[cur]):
            if w > 0 and i not in visited:
                heappush(h, (weight + w, i))
    return visited
```

:::

::: tab java

```java
Map<Integer, Integer> dijkstra(int[][] matrix, int source) {
    int n = matrix.length;
    // PriorityQueue<int[]> pq = new PriorityQueue<>((a, b) -> a[0] - b[0]);
    PriorityQueue<Entry> pq = new PriorityQueue<>();
    pq.add(new Entry(0, source));
    Map<Integer, Integer> visited = new HashMap<>();
    while (!pq.isEmpty() && visited.size() < n) {
        Entry e = pq.poll();
        if (visited.containsKey(e.number)) {
            continue;
        }
        visited.put(e.number, e.distance);
        for (int i = 0; i < n; i++) {
            int w = matrix[e.number][i];
            if (w > 0 && !visited.containsKey(i)) {
                pq.add(new Entry(e.distance + w, i));
            }
        }
    }

    return visited;
}
```

:::

::::

[comment]: # "# todo: 加改进版heap"

## Tests

:::: tabs

::: tab python

<iframe height="600px" width="100%" src="https://repl.it/@LucienZhang/sssp?lite=true" scrolling="no" frameborder="no" allowtransparency="true" allowfullscreen="true" sandbox="allow-forms allow-pointer-lock allow-popups allow-same-origin allow-scripts allow-modals" loading="lazy"></iframe>

:::

::: tab java

<iframe height="600px" width="100%" src="https://repl.it/@LucienZhang/sssp-java?lite=true" scrolling="no" frameborder="no" allowtransparency="true" allowfullscreen="true" sandbox="allow-forms allow-pointer-lock allow-popups allow-same-origin allow-scripts allow-modals" loading="lazy"></iframe>

:::

::::
