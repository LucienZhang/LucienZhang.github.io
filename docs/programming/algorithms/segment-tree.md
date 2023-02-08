# Segment Tree

## Array Representation of Binary Tree

For a binary tree with `n` nodes, it can be represented by an array `T`.

1. The index of `T` is from 1 to n, `T[0]` is empty
1. The root of the tree is located at `T[1]`
1. The parent nodes are located at `T[:n//2+1]`
1. The leaf nodes are located at `T[n//2+1:]`
1. for `1 <= i <= n//2`, its children are located at `T[2*i]` and `T[2*i+1]` (may not exist)
1. for `2 <= i <= n`, its parent node is located at `T[i//2]`

## Implementation

### Bottom Up

Single element update, range query, bottom up

for an array of length n, we need 2n space to store the segment tree, which contains 2n-1 values.

| Algorithm | Complexity  |
| :-------: | :---------: |
|   Space   |   $O(n)$    |
| Construct |   $O(n)$    |
|  Update   | $O(\log n)$ |
|   Query   | $O(\log n)$ |

:::: tabs

::: tab python

```py
from typing import List


class SegmentTree(object):
    def __init__(self, arr: List[int]) -> None:
        n = len(arr)
        tree = [0] * (2 * n)
        for i in range(n):
            tree[i + n] = arr[i]
        for i in range(n - 1, 0, -1):
            # The merging may be different for different problems
            tree[i] = tree[i << 1] + tree[i << 1 | 1]

        self.n = n
        self.tree = tree

    def update(self, pos: int, value: int) -> None:
        n = self.n
        tree = self.tree

        pos += n
        tree[pos] = value
        while pos > 1:
            tree[pos >> 1] = tree[pos] + tree[pos ^ 1]
            pos >>= 1

    def query(self, l: int, r: int) -> int:
        n = self.n
        tree = self.tree

        # get sum on interval [l, r]
        res = 0
        l += n
        r += n

        while l <= r:
            if l % 2 == 1:
                res += tree[l]
                l += 1
            if r % 2 == 0:
                res += tree[r]
                r -= 1
            l >>= 1
            r >>= 1

        return res
```

:::

::: tab java

```java
class SegmentTree {
    int n;
    int[] tree;

    SegmentTree(int[] arr) {
        n = arr.length;
        tree = new int[2 * n];
        for (int i = 0; i < n; i++) {
            tree[i + n] = arr[i];
        }
        for (int i = n - 1; i > 0; i--) {
            // The merging may be different for different problems
            tree[i] = tree[i << 1] + tree[i << 1 | 1];
        }
    }

    void update(int pos, int value) {
        pos += n;
        tree[pos] = value;
        while (pos > 1) {
            tree[pos >> 1] = tree[pos] + tree[pos ^ 1];
            pos >>= 1;
        }
    }

    int query(int l, int r) {
        int res = 0;
        l += n;
        r += n;
        while (l <= r) {
            if (l % 2 == 1) {
                res += tree[l];
                l++;
            }
            if (r % 2 == 0) {
                res += tree[r];
                r--;
            }
            l >>= 1;
            r >>= 1;
        }
        return res;
    }
}
```

:::

::::

### Top Down

Range update, range query, lazy propagation, top down

for an array of length n, we need 2n space to store the segment tree, which contains 2n-1 values. Moreover, we need some space to cache the result of calculating the range of a given index.

|    Algorithm    | Complexity  |
| :-------------: | :---------: |
|      Space      |   $O(n)$    |
|    Construct    |   $O(n)$    |
| Update By Range | $O(\log n)$ |
|      Query      | $O(\log n)$ |

:::: tabs

::: tab python

```py
from typing import List
from functools import lru_cache


class SegmentTreeTopDown(object):
    def __init__(self, arr: List[int]) -> None:
        n = len(arr)
        tree = [0] * (2 * n)
        for i in range(n):
            tree[i + n] = arr[i]
        for i in range(n - 1, 0, -1):
            # The merging may be different for different problems
            l = i << 1
            r = i << 1 | 1
            tree[i] = tree[l] + tree[r]

        self.n = n
        self.tree = tree
        self.lazy = [None] * (2 * n)

    @lru_cache(None)
    def span(self, cur: int) -> Tuple[int, int]:
        n = self.n

        left = right = cur
        while right < n:
            left <<= 1
            right = right << 1 | 1
        if left < n:
            left <<= 1
        return left - n, right - n

    def update(self, left: int, right: int, value: int) -> None:
        n = self.n
        tree = self.tree
        span = self.span
        lazy = self.lazy

        def node_update(cur: int) -> None:
            if cur >= n:
                if lazy[cur] is not None:
                    tree[cur] = lazy[cur]
                    lazy[cur] = None

                pos, _ = span(cur)
                if left <= pos <= right:
                    tree[cur] = value
                return

            cur_left, cur_right = span(cur)

            if lazy[cur] is not None:
                tree[cur] = lazy[cur] * (cur_right - cur_left + 1)
                lazy[cur] = None
                lazy[cur << 1] = lazy[cur]
                lazy[cur << 1 | 1] = lazy[cur]

            if right < cur_left <= cur_right or cur_left <= cur_right < left or (
                    cur_right < left and right < cur_left):
                # Independent
                return
            elif left <= cur_left <= cur_right <= right:
                # Within
                tree[cur] = value * (cur_right - cur_left + 1)
                lazy[cur << 1] = value
                lazy[cur << 1 | 1] = value
            else:
                # Overlap
                node_update(cur << 1)
                node_update(cur << 1 | 1)
                tree[cur] = tree[cur << 1] + tree[cur << 1 | 1]

        node_update(1)

    def query(self, left: int, right: int) -> int:
        # get sum on interval [left, right]
        n = self.n
        tree = self.tree
        span = self.span
        lazy = self.lazy

        def node_query(cur: int) -> int:
            if cur >= n:
                if lazy[cur] is not None:
                    tree[cur] = lazy[cur]
                    lazy[cur] = None

                pos, _ = span(cur)
                if left <= pos <= right:
                    return tree[cur]
                return 0

            cur_left, cur_right = span(cur)

            if lazy[cur] is not None:
                tree[cur] = lazy[cur] * (cur_right - cur_left + 1)
                lazy[cur] = None
                lazy[cur << 1] = lazy[cur]
                lazy[cur << 1 | 1] = lazy[cur]

            if right < cur_left < cur_right or cur_left < cur_right < left or (
                    cur_right < left and right < cur_left):
                # Independent
                return 0
            elif left <= cur_left < cur_right <= right:
                # Within
                return tree[cur]
            else:
                # Overlap
                return node_query(cur << 1) + node_query(cur << 1 | 1)

        return node_query(1)
```

:::

::: tab java

```java
class SegmentTreeTopDown {
    class Range {
        int left;
        int right;

        Range(int left, int right) {
            this.left = left;
            this.right = right;
        }
    }

    int n;
    int[] tree;
    Integer[] lazy;

    SegmentTreeTopDown(int[] arr) {
        n = arr.length;
        tree = new int[2 * n];
        lazy = new Integer[2 * n];

        for (int i = 0; i < n; i++) {
            tree[i + n] = arr[i];
        }
        for (int i = n - 1; i > 0; i--) {
            // The merging may be different for different problems
            int l = i << 1;
            int r = i << 1 | 1;
            tree[i] = tree[l] + tree[r];
        }
    }

    private Range span(int cur) {
        int left = cur;
        int right = cur;
        while (right < n) {
            left <<= 1;
            right = right << 1 | 1;
        }
        if (left < n) {
            left <<= 1;
        }
        return new Range(left - n, right - n);
    }

    private void node_update(int left, int right, int value, int cur) {
        if (cur >= n) {
            if (lazy[cur] != null) {
                tree[cur] = lazy[cur];
                lazy[cur] = null;

            }
            int pos = span(cur).left;
            if (left <= pos && pos <= right) {
                tree[cur] = value;
            }
            return;
        }

        Range r = span(cur);
        int cur_left = r.left;
        int cur_right = r.right;

        if (lazy[cur] != null) {
            tree[cur] = lazy[cur] * (cur_right - cur_left + 1);
            lazy[cur] = null;
            lazy[cur << 1] = lazy[cur];
            lazy[cur << 1 | 1] = lazy[cur];
        }

        if ((right < cur_left && cur_left <= cur_right) || (cur_left <= cur_right && cur_right < left)
                || (cur_right < left && right < cur_left)) {
            // Independent
            return;
        } else if ((left <= cur_left) && (cur_left <= cur_right) && (cur_right <= right)) {
            // Within
            tree[cur] = value * (cur_right - cur_left + 1);
            lazy[cur << 1] = value;
            lazy[cur << 1 | 1] = value;
        } else {
            // Overlap
            node_update(left, right, value, cur << 1);
            node_update(left, right, value, cur << 1 | 1);
            tree[cur] = tree[cur << 1] + tree[cur << 1 | 1];
        }
    }

    void update(int left, int right, int value) {
        node_update(left, right, value, 1);
    }

    private int node_query(int left, int right, int cur) {
        if (cur >= n) {
            if (lazy[cur] != null) {
                tree[cur] = lazy[cur];
                lazy[cur] = null;

            }
            int pos = span(cur).left;
            if (left <= pos && pos <= right) {
                return tree[cur];
            }
            return 0;
        }

        Range r = span(cur);
        int cur_left = r.left;
        int cur_right = r.right;

        if (lazy[cur] != null) {
            tree[cur] = lazy[cur] * (cur_right - cur_left + 1);
            lazy[cur] = null;
            lazy[cur << 1] = lazy[cur];
            lazy[cur << 1 | 1] = lazy[cur];
        }

        if ((right < cur_left && cur_left <= cur_right) || (cur_left <= cur_right && cur_right < left)
                || (cur_right < left && right < cur_left)) {
            // Independent
            return 0;
        } else if ((left <= cur_left) && (cur_left <= cur_right) && (cur_right <= right)) {
            // Within
            return tree[cur];
        } else {
            // Overlap
            return node_query(left, right, cur << 1) + node_query(left, right, cur << 1 | 1);
        }
    }

    int query(int left, int right) {
        return node_query(left, right, 1);
    }
}
```

:::

::::

## Tests

:::: tabs

::: tab python

<iframe height="600px" width="100%" src="https://repl.it/@LucienZhang/segment-tree?lite=true" scrolling="no" frameborder="no" allowtransparency="true" allowfullscreen="true" sandbox="allow-forms allow-pointer-lock allow-popups allow-same-origin allow-scripts allow-modals" loading="lazy"></iframe>

:::

::: tab java

<iframe height="600px" width="100%" src="https://repl.it/@LucienZhang/segment-tree-java?lite=true" scrolling="no" frameborder="no" allowtransparency="true" allowfullscreen="true" sandbox="allow-forms allow-pointer-lock allow-popups allow-same-origin allow-scripts allow-modals" loading="lazy"></iframe>

:::

::::
