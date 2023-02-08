# Cache

## LRU

Least Recently Used

| Algorithm | Complexity |
| :-------: | :--------: |
|   Space   |   $O(n)$   |
|    Get    |   $O(1)$   |
|    Put    |   $O(1)$   |

1. Implemented by Built-in Structures

:::: tabs

::: tab python

Implemented by OrderedDict

```py
from collections import OrderedDict

class LRUCache(OrderedDict):
    def __init__(self, capacity: int):
        super().__init__()
        self.capacity = capacity

    def get(self, key: int):
        if key not in self:
            return None
        self.move_to_end(key)
        return self[key]

    def put(self, key: int, value) -> None:
        if key in self:
            self.move_to_end(key)
        self[key] = value
        if len(self) > self.capacity:
            self.popitem(last=False)
```

:::

::: tab java

Implemented by LinkedHashMap

```java

```

:::

::::

2. Implemented by hash table and doubly linked list

:::: tabs

::: tab python

```py
class LRUNode(object):
    def __init__(self, key: int, value):
        self.key = key
        self.value = value
        self.pre = None
        self.nxt = None


class LRUCache2(object):
    def __init__(self, capacity: int):
        if capacity < 1:
            raise ValueError
        self.capacity = capacity
        self.head = LRUNode(-1, None)
        self.tail = LRUNode(-1, None)
        self.head.nxt = self.tail
        self.tail.pre = self.head
        self.nodes = {}

    def move_to_end(self, node: LRUNode) -> None:
        if node.nxt is self.tail:
            return
        node.pre.nxt = node.nxt
        node.nxt.pre = node.pre
        self.append(node)

    def append(self, node: LRUNode) -> None:
        precursor = self.tail.pre
        precursor.nxt = node
        node.pre = precursor
        self.tail.pre = node
        node.nxt = self.tail

    def pop_first(self) -> LRUNode:
        if len(self.nodes) <= 0:
            raise RuntimeError
        node = self.head.nxt
        node.pre.nxt = node.nxt
        node.nxt.pre = node.pre
        node.pre = None
        node.nxt = None
        self.nodes.pop(node.key)
        return node

    def get(self, key: int):
        if key not in self.nodes:
            return None
        node = self.nodes[key]
        self.move_to_end(node)
        return node.value

    def put(self, key: int, value) -> None:
        if key in self.nodes:
            node = self.nodes[key]
            node.value = value
            self.move_to_end(node)
        else:
            node = LRUNode(key, value)
            self.append(node)
            self.nodes[key] = node
            if len(self.nodes) > self.capacity:
                self.pop_first()
```

:::

::: tab java

```java

```

:::

::::

## LFU

Least Frequently Used

| Algorithm | Complexity |
| :-------: | :--------: |
|   Space   |   $O(n)$   |
|    Get    |   $O(1)$   |
|    Put    |   $O(1)$   |

:::: tabs

::: tab python

```py
class LFUNode(object):
    def __init__(self, key: int, value):
        self.key = key
        self.value = value
        self.freq = 1
        self.pre = None
        self.nxt = None


class LFUList(object):
    def __init__(self):
        self.head = LFUNode(-1, None)
        self.tail = LFUNode(-1, None)
        self.head.nxt = self.tail
        self.tail.pre = self.head

    def append(self, node: LFUNode) -> None:
        precursor = self.tail.pre
        precursor.nxt = node
        node.pre = precursor
        self.tail.pre = node
        node.nxt = self.tail

    def is_empty(self):
        return self.head.nxt is self.tail

    def pop_first(self) -> LFUNode:
        if self.is_empty():
            raise RuntimeError
        node = self.head.nxt
        node.pre.nxt = node.nxt
        node.nxt.pre = node.pre
        node.pre = None
        node.nxt = None
        return node


class LFUCache(object):
    def __init__(self, capacity: int):
        if capacity < 1:
            raise ValueError
        self.capacity = capacity
        self.nodes = {}
        self.lists = defaultdict(LFUList)
        self.least_freq = 0

    def _touch(self, node: LFUNode) -> None:
        node.pre.nxt = node.nxt
        node.nxt.pre = node.pre
        node.pre = node.nxt = None
        if self.lists[node.freq].is_empty() and self.least_freq == node.freq:
            self.least_freq += 1
        node.freq += 1
        self.lists[node.freq].append(node)

    def get(self, key: int):
        if key not in self.nodes:
            return None
        node = self.nodes[key]
        self._touch(node)
        return node.value

    def put(self, key: int, value) -> None:
        if key in self.nodes:
            node = self.nodes[key]
            self._touch(node)
            node.value = value
        else:
            if len(self.nodes) >= self.capacity:
                obsolete = self.lists[self.least_freq].pop_first()
                self.nodes.pop(obsolete.key)
            self.least_freq = 1
            node = LFUNode(key, value)
            self.nodes[key] = node
            self.lists[1].append(node)
```

:::

::: tab java

```java

```

:::

::::

## Tests

:::: tabs

::: tab python

<iframe height="600px" width="100%" src="https://repl.it/@LucienZhang/cache?lite=true" scrolling="no" frameborder="no" allowtransparency="true" allowfullscreen="true" sandbox="allow-forms allow-pointer-lock allow-popups allow-same-origin allow-scripts allow-modals" loading="lazy"></iframe>

:::

::: tab java

:::

::::
