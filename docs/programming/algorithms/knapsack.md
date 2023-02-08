# Knapsack Problem

The **knapsack problem** is a problem in [combinatorial optimization](https://en.wikipedia.org/wiki/Combinatorial_optimization): Given a set of items, each with a weight and a value, determine the number of each item to include in a collection so that the total weight is less than or equal to a given limit and the total value is as large as possible. It derives its name from the problem faced by someone who is constrained by a fixed-size [knapsack](https://en.wikipedia.org/wiki/Knapsack) and must fill it with the most valuable items. The problem often arises in [resource allocation](https://en.wikipedia.org/wiki/Resource_allocation) where the decision makers have to choose from a set of non-divisible projects or tasks under a fixed budget or time constraint, respectively.[^knapsack] The problem is
known to be NP-hard even for the simplified version.

[^knapsack]: <https://en.wikipedia.org/wiki/Knapsack_problem>

## Simplified Version

Suppose that you are in an all-you-can-eat strawberry farm, where you can have an unlimited amount of strawberry, but when you decide to eat a strawberry, you have to each a whole of it. We have the following optimization model, because we want to eat the maximum amount of strawberry.

- Input:
  - Positive integer $n$ (number of strawberries)
  - Positive real numbers $w_1,...,w_n$ (weight of each strawberry)
  - Positive real number $W$ (maximum weight of strawberry that we can eat)
  - Assumption: $w_1 \le w_2 \le ... \le w_n$
- Output: Set $S \subseteq \{1,...,n\}$ (set of strawberries we eat)
- Constraint: $\sum\limits_{i\in S} w_i \le W$
- Objective Function: Maximize $\sum\limits_{i\in S} w_i$

### Algorithm for the Simplified Version

<Pseudo>
    \begin{algorithm}
    \begin{algorithmic}
      \STATE $S \gets \varnothing$
      \FOR{$j = 1$ \TO $n$}
        \IF{$\sum\limits_{i\in S} w_i + w_j\le W$}
          \STATE $S \gets S \cup \{j\}$
        \ELSE
          \IF{$w_j \ge \sum\limits_{i\in S} w_i$}
            \STATE $S \gets \{j\}$
          \ENDIF
          \STATE \textbf{break}
        \ENDIF
      \ENDFOR
      \RETURN $S$
    \end{algorithmic}
    \end{algorithm}
</Pseudo>

Here we assume that for all $i$, $w_i \le W$

If this assumption doesn't hold, we can just pick those over-weight out beforehand.

This is a 0.5-approximation algorithm, i.e., $SOL \ge 0.5 \ OPT$ for any input.

### Proof of the Simplified Version

Here we prove that the algorithm is a 0.5-approximation algorithm, i.e., $SOL \ge 0.5 \ OPT$ for any input.

1. $OPT \le W$

2. if $\sum\limits_{i=1}^{n} w_i \le W$, i.e., the loop never break, then

   $$SOL = OPT$$

   Otherwise,

   $$\text{weight sum of previously chosen strawberries} + \text{weight of last one} \ge W$$

   Thus, either $\text{weight sum of previously chosen strawberries} \ge 0.5W$ or $\text{weight of last one} \ge 0.5W$, we pick the larger one of them, so $SOL \ge 0.5W$

3. $SOL \ge 0.5W \ge 0.5 \ OPT$

## Full Version

Suppose that you are in an all-you-can-eat strawberry farm, where you can have an unlimited amount of strawberry, but when you decide to eat a strawberry, you have to each a whole of it. We have the following optimization model, because we want to eat strawberries with the maximum amount of happiness.

- Input:
  - Positive integer $n$ (number of strawberries)
  - Positive real numbers $w_1,...,w_n$ (weight of each strawberry)
  - Positive real number $W$ (maximum weight of strawberry that we can eat)
  - **Positive real numbers $h_1,...,h_n$ (happiness from eating each strawberry)**
  - **Assumption: $\frac{h_1}{w_1} \ge \frac{h_2}{w_2} \ge ... \ge \frac{h_n}{w_n}$**
- Output: Set $S \subseteq \{1,...,n\}$ (set of strawberries we eat)
- Constraint: $\sum\limits_{i\in S} w_i \le W$
- Objective Function: **Maximize $\sum\limits_{i\in S} h_i$**

The differences from the simplified version previously discussed are marked in bold italic. Instead of assuming that a smaller strawberry will come before a larger one, we sort the strawberries by the happiness gained per weight consumed. It is straightforward to show that the knapsack problem is NP-hard based on the fact that the simplified version is NP-hard.

### Algorithm

<Pseudo>
    \begin{algorithm}
    \begin{algorithmic}
      \STATE $S \gets \varnothing$
      \FOR{$j = 1$ \TO $n$}
        \IF{$\sum\limits_{i\in S} w_i + w_j\le W$}
          \STATE $S \gets S \cup \{j\}$
        \ELSE
          \IF{$h_j \ge \sum\limits_{i\in S} h_i$}
            \STATE $S \gets \{j\}$
          \ENDIF
          \STATE \textbf{break}
        \ENDIF
      \ENDFOR
      \RETURN $S$
    \end{algorithmic}
    \end{algorithm}
</Pseudo>

We can prove that the algorithm is also a 0.5-approximation algorithm, which means that, for any particular input, the happiness we have from the algorithm is no less than 50% of the optimal solution.

[comment]: # "# todo: Bloom Filters, Adaptive Bloom Filter (http://www.vorapong-sup.net/AO2019%20-%20Lecture%203.pdf)"
