# 日本税务计算器：来源索引与适用范围

核对日期：2026-09-06。适用 2025 年工资收入、2026 年度住民税。本索引取代原有空壳阶段的待定口径；决策历史见 handoff.md，算法和舍入见 calculation-rules.md。

## 票据与扣除

| 官方依据 | 页面用途 |
| --- | --- |
| [源泉徴収票字段总览](https://www.nta.go.jp/publication/pamph/hotei/tebikihtml/2-2-0.htm) | 日文栏名及③④⑤⑥示意；不是正式票据 |
| [支払金額③](https://www.nta.go.jp/publication/pamph/hotei/tebikihtml/2-2-3.htm) | 給与等の収入金額的票据位置 |
| [源泉徴収税額⑥](https://www.nta.go.jp/publication/pamph/hotei/tebikihtml/2-2-6.htm) | 已预扣所得税及復興特別所得税；用于退税/补缴结算 |
| [所得控除合计⑤](https://www.nta.go.jp/publication/pamph/hotei/tebikihtml/2-2-5.htm) | 所得税用合计；票面空白不等于零 |
| [所得控除种类 No.1100](https://www.nta.go.jp/taxes/shiraberu/taxanswer/shotoku/1100.htm) | 逐项输入目录；各项原文链接由 fields.js 维护 |
| [横浜市：2026 年度住民税所得控除](https://www.city.yokohama.lg.jp/kurashi/koseki-zei-hoken/zeikin/y-shizei/kojin-shiminzei-kenminzei/kojin-shiminzei-shosai/shotokukoujoR8.html) | 住民税用合计与明细帮助，说明不能直接照搬所得税扣除 |

输入两套扣除均包含各自口径的基礎控除，排除ふるさと納税；逐项填写的是已确定扣除額，不自动推算资格、保费或费用。寄附金税額控除、調整控除和房贷税额抵扣不是所得控除。

## 所得与税额

| 官方依据 | 已实现/适用限制 |
| --- | --- |
| [給与所得控除 No.1410](https://www.nta.go.jp/taxes/shiraberu/taxanswer/shotoku/1410.htm)、[2025 年精确表](https://www.nta.go.jp/taxes/shiraberu/shinkoku/tebiki/2025/03/order2/3-2_06.htm) | 工资收入转换給与所得；已按勾选应用子女/特别残障类所得金額調整控除，未计特定支出控除 |
| [所得税率 No.2260](https://www.nta.go.jp/taxes/shiraberu/taxanswer/shotoku/2260.htm) | 課税所得千元截尾、税率档与速算扣除额；已计房贷抵扣，未计其他所得税税額控除 |
| [復興特別所得税](https://www.nta.go.jp/publication/pamph/shotoku/fukko_tokubetsu/index.htm) | 2.1%；按用户授权使用全所得基准，不区分居民类别 |
| [中野区：2026 年度住民税算例](https://www.city.tokyo-nakano.lg.jp/kurashi/zeikin/jyuminzei-kazei/jyuminzei-keisanrei.html) | 住民税课税所得千元截尾及一般税率 6%＋4%；仅用其税率/算例部分，調整控除资格依据京都市 |
| [京都市：調整控除](https://www.city.kyoto.lg.jp/gyozai/page/0000028147.html) | 手填两级税額控除合计，计算调整前后所得割中间值 |

住民税适用于已确认需缴所得割的工资所得者；不自动判断非课税资格，不覆盖地方税率差异。所得割中间值不包含其他税額控除、均等割、森林环境税及最终征收舍入，不是全年应纳税额。

## 故乡税、退税与征收

| 官方依据 | 页面用途及实现状态 |
| --- | --- |
| [ふるさと納税 No.1155](https://www.nta.go.jp/taxes/shiraberu/taxanswer/shotoku/1155.htm) | 固定输入全年实际寄附金額，包含自付部分；申报方式的减税去向及条件 |
| [京都市：寄附金税額控除](https://www.city.kyoto.lg.jp/gyozai/page/0000054663.html) | 所得割特例控除20%上限、实际适用比例、one-stop所得税相当分；页面上限采用当前所得税率代用，仅为概算 |
| [還付申告 No.2030](https://www.nta.go.jp/taxes/shiraberu/taxanswer/shotoku/2030.htm) | 退税/补缴估算；详见 settlement-rules.md |
| [新宿区：纳付说明](https://www.city.shinjuku.lg.jp/hoken/file04_04_00001.html) | 工资特别征收6月至翌年5月；已提供年度/月度概算，加入标准固定税额和分期舍入 |

捐款额和申请方式影响下方退税/补缴与月度住民税，上方仍为捐款前基线。上限概算未验证所得税40%和住民税30%的捐款额限制，税率分档附近可能有偏差，不保证自付恰为2,000日元。自治体链接仅为官方规则参考，不代表用户居住地。完整推导见 furusato-research.md。

## 文案组织

- 正文保留影响输入或理解结果的短提示：两税扣除排除故乡税、上限为概算、所得割非全年税额、退税/月税为限定范围概算。
- 问号说明承载字段定义、票据位置、结果含义、住民税范围及申请方式区别。
- 较长公式与统一范围保留折叠块；来源按三组折叠，避免长链接列表占据主流程。
- 官方链接另开页面，不加载外部嵌入资源；自治体链接不再误称国税厅原文。

## 退税与月度住民税（2026-09-06）

已接入结算、故乡税40%/30%限额、特例分20%限额、one-stop追加分、标准均等割与森林税以及年度/月度舍入。官方依据、假设和98项结算断言见 [settlement-rules.md](./settlement-rules.md)。上限概算仍保留原先近似口径，不能作为精确的全额抵扣上限。

本轮来源可访问性检查：页面使用的36个官方URL均返回HTTP 200，见source-link-audit.json。葛饰区旧年度PDF仅作为舍入示例，当前年度资格和税率依据另列；原浦添失效PDF已替换。其他捐款合并扣除的边界见settlement-rules.md。

## 扣除覆盖核查（2026-09-06）

详见 [deduction-coverage-review.md](./deduction-coverage-review.md)。DC/iDeCo已有本人缴费入口，社保中的支援金不另列重复扣除；后续已接入房贷税額控除及子女/特别残障类所得金額調整控除，详见credits-rules.md。已补充各项条件、票据内书拆分及官方依据。新增资料后43个官方URL可访问，source-link-audit.json为最新结果。

发现2026年工资/基础扣除及扶养所得门槛已有改正，现有工资算法仍为2025表；主声明按用户要求改为核对日期，具体算法版本在来源/公式处保留。早前检查通过不代表2026规则已迁移。条件校验与新增算法未在本轮实现。

## 两项抵扣接入（2026-09-06）

当前算法与输入边界见 [credits-rules.md](./credits-rules.md)。房贷使用已按证明确定的可能額，不从房屋和借款原始资料推导；资格选项校验本人所得上限及首次申报，住民税结转支持5%/97,500与7%/136,500或不适用。当前45个页面官方URL可访问。工资精确表仍为2025版本。
