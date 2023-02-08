# Collections

:::: tabs

::: tab python

<Jupyter filePath="collections/python.ipynb" />

:::

::: tab java

I always feel that the Collections Framework of Java is designed to be confusing, not only because of the naming of classes and methods, but also because of the result of Java's religious obsessoin with object-oriented programming.

There are two base interfaces in Java's Collections Framework, **Collection** (`java.util Interface Collection<E>`), and **Map** (`java.util Interface Map<K,V>`). Note that the name _<u>Collections</u>_(`java.util Class Collections`) is an utility class providing static methods like sorting, searching, etc. You now know how ugly the names are designed!

| ![Hierarchy of Java Collection framework](@assets/img/java/collection-hierarchy.png) |
| :----------------------------------------------------------------------------------: |
|                _Hierarchy of Java Collection framework_[^collection]                 |

[^collection]: <https://www.javatpoint.com/collections-in-java>

| ![Java Map Hierarchy](@assets/img/java/map-hierarchy.png) |
| :-------------------------------------------------------: |
|                _Java Map Hierarchy_[^map]                 |

[^map]: <https://www.javatpoint.com/java-map>

|                        Thread Unsafe                        |                        Thread Safe                        |
| :---------------------------------------------------------: | :-------------------------------------------------------: |
|                        StringBuilder                        |                       StringBuffer                        |
|                          ArrayList                          |                          Vector                           |
| HashMap<br />(allows one null key and multiple null values) | HashTable<br />(doesn’t allow any null key or null value) |
|                                                             |                        Properties                         |
|                  TreeMap (red black tree)                   |                                                           |
|                                                             |                  java.util.concurrent.\*                  |

---

<Jupyter filePath="collections/java.ipynb" />

:::

::: tab scala

<https://docs.scala-lang.org/overviews/collections/overview.html>

<Jupyter filePath="collections/scala.ipynb" />

:::

::::
