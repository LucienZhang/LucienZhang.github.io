# Handwritten Digit Recognition

This is a classification project trained on [MNIST](http://yann.lecun.com/exdb/mnist/) dataset. You can try it at [the end of this article](#demo).

## MNIST Dataset

MNIST[^mnist] is a dataset of handwritten digits, including 55,000 training samples, 5,000 validation samples, and 10,000 test samples. Each sample has a labeled gray value 28\*28 pixel handwritten digit image, as examples shown below.

[^mnist]: <http://yann.lecun.com/exdb/mnist/>

|  ![Mnist Examples](@assets/img/ml/MnistExamples.png)   |
| :----------------------------------------------------: |
| _Sample images from MNIST test dataset_[^mnist_sample] |

[^mnist_sample]: Image By Josef Steppan - Own work, CC BY-SA 4.0, <https://commons.wikimedia.org/w/index.php?curid=64810040>

## LeNet-5

Yann LeCun, Leon Bottou, Yosuha Bengio and Patrick Haffner proposed a neural network architecture for handwritten and machine-printed character recognition in 1990's which they called LeNet-5[^lenet]. Though the architecture is straightforward and simple to understand, it's an important milestone for Convolutional Neural Network (CNN) and Image Classification. Before it was invented, character recognition had been done mostly by using feature engineering by hand, followed by a machine learning model to learn to classify hand engineered features. LeNet made hand engineering features redundant, because the network learns the best internal representation from raw images automatically.

[^lenet]: <http://yann.lecun.com/exdb/lenet/>

## Demo

Write down a digit and press `Recognize` to try it yourself!

<DemoMnist/>
