# werewolf game

```python {4-6,9}
a=0
b=1
for i in range(5):
    print(i)

from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI()


class Item(BaseModel):
    name: str
    description: str = None
    price: float
    tax: float = None

```

<!-- <a-button type="primary">Primary</a-button> -->

:::: tabs

::: tab title
**markdown content**
:::

::: tab javascript

```javascript
() => {
  console.log("Javascript code example");
};
```

:::

::::

<Jupyter filePath="test.ipynb" />
