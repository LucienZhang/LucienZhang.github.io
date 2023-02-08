# Vertex Cover Problem

In the mathematical discipline of graph theory, a vertex cover (sometimes node cover) of a graph is a set of vertices that includes at least one endpoint of every edge of the graph. The minimum vertex cover problem is the optimization problem of finding a smallest vertex cover in a given graph. In short, it is to find a minimum set of vertices to track all edges.

- Input: Set $\mathbf{V}$, Set $\mathbf{E} \subseteq \{\{u,v\}|u,v \in \mathbf{V}\}$
- Output: Set $\mathbf{S} \subseteq \mathbf{V}$
- Constraint: For all $\{u,v\} \in \mathbf{E}$, either $u \in \mathbf{S}$ or $v \in \mathbf{S}$
- Objective Function: Minimize $|\mathbf{S}|$

Suppose $\mathbf{V}=\{1,...,n\}$, we can express the output as a vector $\vec{x}=(x_1,...,x_n)^\intercal$, where $x_i=1$ if $i\in \mathbf{S}$, otherwise, $x_i=0$

We introduce the Incidence Matrix $\mathbf{A}$ for this problem. Matrix $\mathbf{A}$ has the shape of $|\mathbf{E}| \times |\mathbf{V}|$, each row represents a relationship (edge). In each row, two elements are 1, indicating that these two nodes are linked. Therefore, the above problem can be expressed as follows.

- Input:
  - Matrix $\mathbf{A}$
  - vector $\vec{b}=(1,...,1)^\intercal$
  - vector $\vec{c}=(1,...,1)^\intercal$
  - Assumption: At each row of $\mathbf{A}$, two elements are 1, others are 0. All elements of $\vec{b}$ and $\vec{c}$ are 1.
- Output: vector $\vec{x}=(x_1,...,x_n)^\intercal$, where $x_i$ is either 0 or 1.
- Constraint: $\mathbf{A}\vec{x} \ge \vec{b}$
- Objective Function: Minimize $\vec{c}^\intercal\vec{x}$

## Rounding

Fractional Vertex Cover

- Input:
  - Matrix $\mathbf{A}$
  - vector $\vec{b}=(1,...,1)^\intercal$
  - vector $\vec{c}=(1,...,1)^\intercal$
  - Assumption: At each row of $\mathbf{A}$, two elements are 1, others are 0. All elements of $\vec{b}$ and $\vec{c}$ are 1.
- **Output: vector $\vec{x}=(x_1,...,x_n)^\intercal$, where $x_i \in [0,1]$**.
- Constraint: $\mathbf{A}\vec{x} \ge \vec{b}$
- Objective Function: Minimize $\vec{c}^\intercal\vec{x}$

## Algorithm

The algorithm is based the fractional vertex cover problem we just defined.

1. Use linear programming to solve fractional vertex cover, and get output vector $\vec{x}=(x_1,...,x_n)^\intercal$, where $x_i \in [0,1]$
2. For all $0 \le i \le n$, let ${x_i}^{'}=1$ when $x_i \ge 0.5$, otherwise, ${x_i}^{'}=0$. Let $\vec{x}^{'}=({x_1}^{'},...,{x_n}^{'})^\intercal$.
3. Return $\vec{x}^{'}$ as the answer of the vertex cover problem.

## Theorem

1. $\vec{x}^{'}$ is an answer for the vertex cover problem. It satisfies the constraint.
2. It is a 2-approximation algorithm. For any particular input, $SOL \le 2 \ OPT$.

## Proof

Here we prove that the algorithm is a 2-approximation algorithm, i.e., $SOL \le 2 \ OPT$ for any input.

Let $\vec{x}=(x_1,...,x_n)^\intercal$ be the optimal solution for the fractional vertex cover problem. It is the vector in ${[0,1]}^{n}$ that minimizes $\vec{c}^\intercal\vec{x}$ when $\mathbf{A}\vec{x} \ge \vec{b}$. On the other hand, let $\vec{x}^{*}$ be the vector in ${\{0,1\}}^{n}$ that minimizes $\vec{c}^\intercal\vec{x}$ when $\mathbf{A}\vec{x} \ge \vec{b}$. Both of the vectors minimize the objective function with the same constraint, but $\vec{x}$ is selected from a larger set. $\vec{x}$ has more chances to minimize the objective function, so the objective value of $\vec{x}$ is better (thus smaller) than that of $\vec{x}^{*}$, i.e., $\vec{c}^\intercal\vec{x} \le \vec{c}^\intercal\vec{x}^{*}$.

Now, consider the value of ${x_i}^{'}$. By the _rounding_ at the step 2 of the algorithm, we have ${x_i}^{'} \le 2 x_i$. Then

$$SOL = \vec{c}^\intercal \vec{x}^{'} = \sum\limits_{i} {{x_i}^{'}} \le 2 \sum\limits_{i} x_i = 2 \vec{c}^\intercal \vec{x} \le 2 \vec{c}^\intercal \vec{x}^{*} = 2 \ OPT$$
