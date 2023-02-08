# Disjoint Sets

## Union-Find Data Structure

Two optimization strategies:

1. Path compression
2. Union by rank

   Initially a set has one element and a rank of zero. If two sets are unioned and have the same rank, the resulting set's rank is one larger

Amortized Complexity

| Algorithm |  Average  | Worst case |
| :-------: | :-------: | :--------: |
|   Space   |  $O(n)$   |   $O(n)$   |
|   Find    | $O(α(n))$ | $O(α(n))$  |
|   Union   | $O(α(n))$ | $O(α(n))$  |

$α(⋅)$ is [inverse Ackermann function](https://en.wikipedia.org/wiki/Ackermann_function#Inverse), for the generally possible value n, $α(n)$ is less than 5

:::: tabs

::: tab python

```py
class UnionFind(object):
    def __init__(self):
        self.parent = {}
        self.rank = {}

    def make_set(self, x):
        self.parent[x] = x
        self.rank[x] = 0

    def find(self, x):
        if self.parent[x] != x:
            self.parent[x] = self.find(self.parent[x])
        return self.parent[x]

    def union(self, x, y):
        x_root = self.find(x)
        y_root = self.find(y)
        if x_root == y_root:
            return

        if self.rank[x_root] == self.rank[y_root]:
            self.parent[y_root] = x_root
            self.rank[x_root] += 1
        elif self.rank[x_root] > self.rank[y_root]:
            self.parent[y_root] = x_root
        else:
            self.parent[x_root] = y_root
```

:::

::: tab java

```java
class UnionFind {
    Map<Integer, Integer> parent = new HashMap<>();
    Map<Integer, Integer> rank = new HashMap<>();

    public void makeSet(int x) {
        parent.put(x, x);
        rank.put(x, 0);
    }

    public int find(int x) {
        int p = parent.get(x);
        if (p != x) {
            parent.put(x, find(p));
        }
        return parent.get(x);
    }

    public void union(int x, int y) {
        int xRoot = find(x);
        int yRoot = find(y);
        if (xRoot == yRoot) {
            return;
        }

        int xRank = rank.get(xRoot);
        int yRank = rank.get(yRoot);

        if (xRank == yRank) {
            parent.put(yRoot, xRoot);
            rank.put(xRoot, xRank + 1);
        } else if (xRank > yRank) {
            parent.put(yRoot, xRoot);
        } else {
            parent.put(xRoot, yRoot);
        }
    }
}
```

:::

::::

## Tests

:::: tabs

::: tab python

<iframe height="600px" width="100%" src="https://repl.it/@LucienZhang/disjoint-sets?lite=true" scrolling="no" frameborder="no" allowtransparency="true" allowfullscreen="true" sandbox="allow-forms allow-pointer-lock allow-popups allow-same-origin allow-scripts allow-modals" loading="lazy"></iframe>

:::

::: tab java

<iframe height="600px" width="100%" src="https://repl.it/@LucienZhang/disjoint-sets-java?lite=true" scrolling="no" frameborder="no" allowtransparency="true" allowfullscreen="true" sandbox="allow-forms allow-pointer-lock allow-popups allow-same-origin allow-scripts allow-modals" loading="lazy"></iframe>

:::

::::
