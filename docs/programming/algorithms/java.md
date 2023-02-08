# Java

![Hierarchy of Java Collection framework](@assets/img/java/collection-hierarchy.png)

![Java Map Hierarchy](@assets/img/java/map-hierarchy.png)

|            Thread Unsafe             |              Thread Safe               |
| :----------------------------------: | :------------------------------------: |
|            StringBuilder             |              StringBuffer              |
|              ArrayList               |                 Vector                 |
| HashMap (allow key or value is null) | HashTable (key and value are nullable) |
|                                      |               Properties               |
|       TreeMap (red black tree)       |                                        |
|                                      |        java.util.concurrent.\*         |

![The java.io package](@assets/img/java/io-stream-hierarchy.png)

![线程生命周期图.png](@assets/img/java/thread-states.png)

线程死亡后，不能重新开启，再次开启是一个新的线程。

```javascript [a]
console.log("Hello world!");
```

```python [a]
print('Hello world!')
```

```ruby [a]
puts 'Hello world!'
```
