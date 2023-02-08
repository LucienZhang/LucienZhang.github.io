# String

## KMP

:::: tabs

::: tab python

```py
def kmp(string, pattern):
    m = len(string)
    n = len(pattern)
    nxt = [-1] * n  # i matches nxt[i]
    for i in range(1, n):
        j = nxt[i - 1]
        while j != -1 and pattern[j + 1] != pattern[i]:
            j = nxt[j]
        if pattern[j + 1] == pattern[i]:
            nxt[i] = j + 1

    i = j = 0
    while i < m and j < n:
        if string[i] == pattern[j]:
            i += 1
            j += 1
        else:
            j -= 1
            while j != -1 and string[i] != pattern[j + 1]:
                j = nxt[j]
            if string[i] == pattern[j + 1]:
                i += 1
                j += 2
            else:
                i += 1
                j += 1

    if j == n:
        return i - n
    else:
        return -1
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

<iframe height="600px" width="100%" src="https://repl.it/@LucienZhang/string?lite=true" scrolling="no" frameborder="no" allowtransparency="true" allowfullscreen="true" sandbox="allow-forms allow-pointer-lock allow-popups allow-same-origin allow-scripts allow-modals" loading="lazy"></iframe>

:::

::: tab java

:::

::::
