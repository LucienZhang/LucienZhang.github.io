# Math Code

[comment]: # "# todo: 约瑟夫环，环入口检测"

## Functions

:::: tabs

::: tab python

```py
import math


def pow(base, index, mod=int(1e9 + 7)):
    ret = 1
    while index:
        if index & 1:
            ret = ret * base % mod
        base = base * base % mod
        index >>= 1
    return ret


def gcd(m, n):
    while n:
        m, n = n, m % n
    return m


def lcm(m, n):
    return m * n // gcd(m, n)


def extgcd(m, n):
    '''
    return d, x, y
    where d is gcd of m, n and d = x * m + y * n
    '''
    if n:
        d, y, x = extgcd(n, m % n)
        y -= (m // n) * x
        return d, x, y
    return m, 1, 0


def inv(a, mod=int(1e9 + 7)):
    '''
    modular multiplicative inverse
    a and mod must be relatively prime
    '''
    d, x, _ = extgcd(a, mod)
    assert d == 1, f'a and mod must be relatively prime, but got {a=}, {mod=}'
    return (x + mod) % mod


def inv_table(m, mod=int(1e9 + 7)):
    '''
    modular multiplicative inverse table
    '''
    table = [1] * (m + 1)
    for i in range(2, m + 1):
        table[i] = (mod - mod // i) * table[mod % i] % mod
    return table


def is_prime(n):
    if n < 2:
        return False
    if n == 2:
        return True
    if ~n & 1:
        return False
    for i in range(3, int(math.sqrt(n)) + 1):
        if n % i == 0:
            return False
    return True


def get_primes(limit):
    '''
    get primes less than or equal to limit
    '''
    primes = [2]
    b = 0  #bitset
    for i in range(3, limit + 1, 2):
        if not b & 1 << i:
            primes.append(i)
        for j in range(i * 3, limit + 1, i * 2):
            b |= 1 << j
    return primes


def get_factors(n, limit=10000):
    primes = get_primes(limit)
    ans = []
    for p in primes:
        if p * p > n:
            break
        while n % p == 0:
            n //= p
            ans.append(p)
    if n > 1:
        ans.append(n)
    return ans


def presum(arr):
    n = len(arr)
    ans = [0] * (n + 1)
    for i, a in enumerate(arr):
        ans[i + 1] = ans[i] + a
    return ans


def postsum(arr):
    n = len(arr)
    ans = [0] * (n + 1)
    for i in range(n - 1, -1, -1):
        a = arr[i]
        ans[i] = ans[i + 1] + a
    return ans


def premax(arr):
    n = len(arr)
    ans = [-float('inf')] * (n + 1)
    for i, a in enumerate(arr):
        ans[i + 1] = max(ans[i], a)
    return ans


def postmax(arr):
    n = len(arr)
    ans = [-float('inf')] * (n + 1)
    for i in range(n - 1, -1, -1):
        a = arr[i]
        ans[i] = max(ans[i + 1], a)
    return ans


def premin(arr):
    n = len(arr)
    ans = [float('inf')] * (n + 1)
    for i, a in enumerate(arr):
        ans[i + 1] = min(ans[i], a)
    return ans


def postmin(arr):
    n = len(arr)
    ans = [float('inf')] * (n + 1)
    for i in range(n - 1, -1, -1):
        a = arr[i]
        ans[i] = min(ans[i + 1], a)
    return ans


def next_different(arr):
    n = len(arr)
    ans = [0] * n
    i = 0
    while i < n:
        j = i + 1
        while j < n and arr[i] == arr[j]:
            j += 1
        while i < j:
            ans[i] = j
            i += 1
    return ans


def pre_different(arr):
    n = len(arr)
    ans = [0] * n
    i = n - 1
    while i >= 0:
        j = i - 1
        while j >= 0 and arr[i] == arr[j]:
            j -= 1
        while i > j:
            ans[i] = j
            i -= 1
    return ans


class Bitset():
    def __init__(self, b=None):
        if b is None:
            self.b = 0
        elif type(b) is int:
            self.b = b
        else:
            self.b = int(b, 2)

    def __repr__(self):
        return f'Bitset({self.b})'

    def set(self, pos=None):
        if pos is None:
            self.b = -1
        else:
            self.b |= 1 << pos

    def reset(self, pos=None):
        if pos is None:
            self.b = 0
        else:
            self.b &= ~(1 << pos)

    def flip(self, pos=None):
        if pos is None:
            self.b = ~self.b
        else:
            self.b ^= 1 << pos

    def check(self, pos=None):
        if pos is None:
            return self.b != 0
        else:
            return bool(self.b & 1 << pos)

    def __call__(self, pos=None):
        return self.check(pos)

    def __bool__(self):
        return self.b != 0

    def __hash__(self):
        return self.b

    def __eq__(self, other):
        return self.b == other.b
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

<iframe height="600px" width="100%" src="https://repl.it/@LucienZhang/math?lite=true" scrolling="no" frameborder="no" allowtransparency="true" allowfullscreen="true" sandbox="allow-forms allow-pointer-lock allow-popups allow-same-origin allow-scripts allow-modals" loading="lazy"></iframe>

:::

::: tab java

<!-- <iframe height="600px" width="100%" src="https://repl.it/@LucienZhang/math-java?lite=true" scrolling="no" frameborder="no" allowtransparency="true" allowfullscreen="true" sandbox="allow-forms allow-pointer-lock allow-popups allow-same-origin allow-scripts allow-modals"></iframe> -->

:::

::::
