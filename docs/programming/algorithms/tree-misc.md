# Tree Misc

## Trie

```py
from collections import defaultdict

Trie = lambda: defaultdict(Trie)
trie = Trie()
for row in ['abc', 'ab', 'abcd']:
    now = trie
    for ch in row:
        now = now[ch]
```

## Tests

<iframe height="600px" width="100%" src="https://repl.it/@LucienZhang/tree-misc?lite=true" scrolling="no" frameborder="no" allowtransparency="true" allowfullscreen="true" sandbox="allow-forms allow-pointer-lock allow-popups allow-same-origin allow-scripts allow-modals" loading="lazy"></iframe>
