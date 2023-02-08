# Tree Traversal

|            Item             |     DFS      |      BFS      |
| :-------------------------: | :----------: | :-----------: |
|       Data Structure        |    Stack     |     Queue     |
|        Vertex Order         | one sequence | two sequences |
|       Time Complexity       |    $O(n)$    |    $O(n)$     |
|      Space Complexity       | $O(height)$  |  $O(width)$   |
| Worst-case Space Complexity |    $O(n)$    |    $O(n)$     |

Example

![Binary Tree](@assets/img/algorithms/tree/binary_tree.png)

Tree Node definition

:::: tabs

::: tab python

```py
class TreeNode:
    def __init__(self, val=0, left=None, right=None):
        self.val = val
        self.left = left
        self.right = right
```

:::

::: tab java

```java
class TreeNode {
    int val;
    TreeNode left;
    TreeNode right;

    TreeNode(int val) {
        this.val = val;
    }
}
```

:::

::: tab cpp

```cpp
class TreeNode {
   public:
    int val;
    TreeNode *left, *right;
    TreeNode(int v) : val(v), left(nullptr), right(nullptr) {}
};
```

:::

::::

## DFS

:::: tabs

::: tab python

```py
def dfs(root: TreeNode):
    stack = [root]
    while stack:
        node = stack.pop()
        print(node.val)
        if node.left:
            stack.append(node.left)
        if node.right:
            stack.append(node.right)
```

:::

::: tab java

```java
void dfs(TreeNode root) {
    LinkedList<TreeNode> stack = new LinkedList<>();
    stack.push(root);
    while (!stack.isEmpty()) {
        TreeNode node = stack.pop();
        System.out.println(node.val);
        if (node.left != null) {
            stack.push(node.left);
        }
        if (node.right != null) {
            stack.push(node.right);
        }
    }
}
```

:::

::: tab cpp

```cpp
void dfs(TreeNode* root) {
    vector<TreeNode*> stack{root};
    while (!stack.empty()) {
        auto node = stack.back();
        stack.pop_back();
        cout << node->val << endl;
        if (node->left) {
            stack.push_back(node->left);
        }
        if (node->right) {
            stack.push_back(node->right);
        }
    }
}
```

:::

::::

## BFS

:::: tabs

::: tab python

```py
from collections import deque

def bfs(root: TreeNode):
    q = deque([root])
    while q:
        node = q.popleft()
        print(node.val)
        if node.left:
            q.append(node.left)
        if node.right:
            q.append(node.right)
```

:::

::: tab java

```java
void bfs(TreeNode root) {
    LinkedList<TreeNode> q = new LinkedList<>();
    q.add(root);
    while (!q.isEmpty()) {
        TreeNode node = q.remove();
        System.out.println(node.val);
        if (node.left != null) {
            q.add(node.left);
        }
        if (node.right != null) {
            q.add(node.right);
        }
    }
}
```

:::

::: tab cpp

```cpp
void bfs(TreeNode* root) {
    deque<TreeNode*> q{root};
    while (!q.empty()) {
        auto node = q.front();
        q.pop_front();
        cout << node->val << endl;
        if (node->left) {
            q.push_back(node->left);
        }
        if (node->right) {
            q.push_back(node->right);
        }
    }
}
```

:::

::::

## Level Order Traversal

:::: tabs

::: tab python

```py
from collections import deque

def lot(root: TreeNode) -> int:
    q = deque([root])
    lv = 0
    while q:
        lv += 1
        print(f'level {lv}')
        for _ in range(len(q)):
            node = q.popleft()
            print(node.val)
            if node.left:
                q.append(node.left)
            if node.right:
                q.append(node.right)
    return lv
```

:::

::: tab java

```java
int lot(TreeNode root) {
    LinkedList<TreeNode> q = new LinkedList<>();
    q.add(root);
    int lv = 0;
    while (!q.isEmpty()) {
        lv++;
        System.out.println("level " + lv);
        int length = q.size();
        for (int i = 0; i < length; i++) {
            TreeNode node = q.remove();
            System.out.println(node.val);
            if (node.left != null) {
                q.add(node.left);
            }
            if (node.right != null) {
                q.add(node.right);
            }
        }
    }
    return lv;
}
```

:::

::: tab cpp

```cpp
int lot(TreeNode* root) {
    deque<TreeNode*> q{root};
    int lv = 0;
    while (!q.empty()) {
        ++lv;
        cout << "level " << lv << endl;
        for (int i = 0, n = q.size(); i < n; ++i) {
            auto node = q.front();
            q.pop_front();
            cout << node->val << endl;
            if (node->left) {
                q.push_back(node->left);
            }
            if (node->right) {
                q.push_back(node->right);
            }
        }
    }
    return lv;
}
```

:::

::::

## Preorder Traversal

:::: tabs

::: tab python

```py
def preorder(root: TreeNode):
    if not root:
        return
    print(root.val)
    preorder(root.left)
    preorder(root.right)
```

```py
from typing import List

def preorder_without_recursion(root: TreeNode) -> List[int]:
    ans = []
    stack = [root]
    while stack:
        node = stack.pop()
        if node is None:
            continue
        ans.append(node.val)
        stack.append(node.right)
        stack.append(node.left)
    return ans
```

:::

::: tab java

```java
void preorder(TreeNode root) {
    if (root == null) {
        return;
    }
    System.out.println(root.val);
    preorder(root.left);
    preorder(root.right);
}
```

```java
List<Integer> preorderWithoutRecursion(TreeNode root) {
    List<Integer> ans = new ArrayList<>();
    LinkedList<TreeNode> stack = new LinkedList<>();
    stack.push(root);
    while (!stack.isEmpty()) {
        TreeNode node = stack.pop();
        if (node == null) {
            continue;
        }
        ans.add(node.val);
        stack.push(node.right);
        stack.push(node.left);
    }
    return ans;
}
```

:::

::: tab cpp

```cpp
void preorder(TreeNode* root) {
    if (!root) {
        return;
    }
    cout << root->val << endl;
    preorder(root->left);
    preorder(root->right);
}
```

```cpp
vector<int> preorder_without_recursion(TreeNode* root) {
    vector<int> ans;
    vector<TreeNode*> stack{root};
    while (!stack.empty()) {
        auto node = stack.back();
        stack.pop_back();
        if (!node) {
            continue;
        }
        ans.push_back(node->val);
        stack.push_back(node->right);
        stack.push_back(node->left);
    }
    return ans;
}
```

:::

::::

## Inorder Traversal

:::: tabs

::: tab python

```py
def inorder(root: TreeNode):
    if not root:
        return
    inorder(root.left)
    print(root.val)
    inorder(root.right)
```

```py
from typing import List

def inorder_without_recursion(root: TreeNode) -> List[int]:
    ans = []
    stack = []
    now = root

    while stack or now:
        if now:
            stack.append(now)
            now = now.left
            continue
        else:
            node = stack.pop()
            ans.append(node.val)
            now = node.right
    return ans
```

:::

::: tab java

```java
void inorder(TreeNode root) {
    if (root == null) {
        return;
    }
    inorder(root.left);
    System.out.println(root.val);
    inorder(root.right);
}
```

```java
List<Integer> inorderWithoutRecursion(TreeNode root) {
    List<Integer> ans = new ArrayList<>();
    Deque<TreeNode> stack = new LinkedList<>();
    TreeNode cur = root;
    while (cur != null || !stack.isEmpty()) {
        if (cur != null) {
            stack.push(cur);
            cur = cur.left;
            continue;
        } else {
            TreeNode node = stack.pop();
            ans.add(node.val);
            cur = node.right;
        }
    }
    return ans;
}
```

:::

::: tab cpp

```cpp
void inorder(TreeNode* root) {
    if (!root) {
        return;
    }
    inorder(root->left);
    cout << root->val << endl;
    inorder(root->right);
}
```

```cpp
vector<int> inorder_without_recursion(TreeNode* root) {
    vector<int> ans;
    vector<TreeNode*> stack;
    TreeNode* cur = root;
    while (!stack.empty() || cur) {
        if (cur) {
            stack.push_back(cur);
            cur = cur->left;
            continue;
        } else {
            auto node = stack.back();
            stack.pop_back();
            ans.push_back(node->val);
            cur = node->right;
        }
    }
    return ans;
}
```

:::

::::

## Postorder Traversal

:::: tabs

::: tab python

```py
def postorder(root: TreeNode):
    if not root:
        return
    postorder(root.left)
    postorder(root.right)
    print(root.val)
```

```py
from typing import List

def postorder_without_recursion(root: TreeNode) -> List[int]:
    if not root:
        return []

    ans = []
    stack = []
    now = root

    while True:
        while now:
            if now.right:
                stack.append(now.right)
            stack.append(now)
            now = now.left
        now = stack.pop()
        if stack and stack[-1] is now.right:
            stack.pop()
            stack.append(now)
            now = now.right
        else:
            ans.append(now.val)
            now = None
        if not stack:
            break
    return ans
```

:::

::: tab java

```java
void postorder(TreeNode root) {
    if (root == null) {
        return;
    }
    postorder(root.left);
    postorder(root.right);
    System.out.println(root.val);
}
```

```java
List<Integer> postorderWithoutRecursion(TreeNode root) {
    if (root == null) {
        return new ArrayList<Integer>();
    }

    List<Integer> ans = new ArrayList<>();
    Deque<TreeNode> stack = new LinkedList<>();
    TreeNode cur = root;

    do {
        while (cur != null) {
            if (cur.right != null) {
                stack.push(cur.right);
            }
            stack.push(cur);
            cur = cur.left;
        }
        cur = stack.pop();
        if (!stack.isEmpty() && stack.peek() == cur.right) {
            stack.pop();
            stack.push(cur);
            cur = cur.right;
        } else {
            ans.add(cur.val);
            cur = null;
        }
    } while (!stack.isEmpty());

    return ans;
}
```

:::

::: tab cpp

```cpp
void postorder(TreeNode* root) {
    if (!root) {
        return;
    }
    postorder(root->left);
    postorder(root->right);
    cout << root->val << endl;
}
```

```cpp
vector<int> postorder_without_recursion(TreeNode* root) {
    if (!root) {
        return {};
    }
    vector<int> ans;
    vector<TreeNode*> stack;
    TreeNode* cur = root;
    while (true) {
        while (cur) {
            if (cur->right) {
                stack.push_back(cur->right);
            }
            stack.push_back(cur);
            cur = cur->left;
        }
        cur = stack.back();
        stack.pop_back();
        if (!stack.empty() && stack.back() == cur->right) {
            stack.pop_back();
            stack.push_back(cur);
            cur = cur->right;
        } else {
            ans.push_back(cur->val);
            cur = nullptr;
        }
        if (stack.empty()) {
            break;
        }
    }
    return ans;
}
```

:::

::::

## Tests

:::: tabs

::: tab python

<iframe height="600px" width="100%" src="https://repl.it/@LucienZhang/binary-tree-traversal?lite=true" scrolling="no" frameborder="no" allowtransparency="true" allowfullscreen="true" sandbox="allow-forms allow-pointer-lock allow-popups allow-same-origin allow-scripts allow-modals" loading="lazy"></iframe>

:::

::: tab java

<iframe height="600px" width="100%" src="https://repl.it/@LucienZhang/binary-tree-traversal-java?lite=true" scrolling="no" frameborder="no" allowtransparency="true" allowfullscreen="true" sandbox="allow-forms allow-pointer-lock allow-popups allow-same-origin allow-scripts allow-modals" loading="lazy"></iframe>

:::

::: tab cpp

<iframe height="600px" width="100%" src="https://repl.it/@LucienZhang/binary-tree-traversal-cpp?lite=true" scrolling="no" frameborder="no" allowtransparency="true" allowfullscreen="true" sandbox="allow-forms allow-pointer-lock allow-popups allow-same-origin allow-scripts allow-modals" loading="lazy"></iframe>

:::

::::
