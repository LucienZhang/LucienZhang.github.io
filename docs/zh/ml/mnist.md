# 手写数字识别

这是一个基于[MNIST](http://yann.lecun.com/exdb/mnist/)数据集的分类任务模型，你可以在[文章的最后](#演示)尝试它的效果。

## MNIST 数据集

MNIST[^mnist]是一个手写体数字数据集，包含 55,000 个训练样本，5,000 个验证样本，及 10,000 个测试样本。每个样本都有一个内容为手写体数字的 28\*28 像素的灰度值图像，以及对应该数字的标签。以下是数据集中的一些样本。

[^mnist]: <http://yann.lecun.com/exdb/mnist/>

|  ![Mnist Examples](@assets/img/ml/MnistExamples.png)   |
| :----------------------------------------------------: |
| _Sample images from MNIST test dataset_[^mnist_sample] |

[^mnist_sample]: Image By Josef Steppan - Own work, CC BY-SA 4.0, <https://commons.wikimedia.org/w/index.php?curid=64810040>

## LeNet-5

Yann LeCun, Leon Bottou, Yosuha Bengio 和 Patrick Haffner 在 20 世纪 90 年代提出了一种用于手写和机器打印字符识别的神经网络架构，他们将其称为 LeNet-5[^lenet]。尽管该架构简单易懂，但这对于卷积神经网络（CNN）和图像分类是一个重要的里程碑。在其发明之前，字符识别主要是通过两个步骤来完成：先利用手动特征工程抽取特征，再用机器学习模型来学习基于这些特征的分类任务。LeNet 使手动特征工程步骤变得多余，因为网络会自动从原始图像中学习最佳内在表示。

[^lenet]: <http://yann.lecun.com/exdb/lenet/>

## 演示

亲自尝试一下吧！写一个数字，按下`识别`即可！

<DemoMnist clearBtnName="清除" recognizeBtnName="识别" resultTag="结果" probTag="概率" warningMsg="请写下一个数字！"/>
