# First calculation increment — 2026-09-06

> 历史过程记录；当前实现、验证结果与剩余边界以 [final-review.md](./final-review.md) 为准。早期空壳、未提交及路由验证失败描述不代表当前状态。截图与运行日志为本地生成文件，可用本目录测试脚本重建。

Authorized: salary income, taxable income (truncate below 1,000 yen), marginal rate, income tax and reconstruction surtax. User explicitly requested the resident basis 全ての所得に対する所得税額 without residency branching. Refund/furusato/resident tax remain deferred.

Rule set: 2025 only, explicitly shown in UI, not inferred as the user's personal income year. Salary-only, no income adjustment deduction, specific-expense deduction, tax credits or foreign tax credits. User supplies established income deductions including basic allowance; no automatic basic allowance or premium conversion. Furusato controls do not affect calculations yet; an established deduction can be included in the total, but no second addition occurs. No deduction draft or missing value is silently zero. Itemized mode requires at least one completed item; use total 0 for no deductions.

Sources read 2026-09-06:
- https://www.nta.go.jp/taxes/shiraberu/taxanswer/shotoku/1410.htm — salary deduction and table requirement below 6.6m.
- https://www.nta.go.jp/taxes/shiraberu/shinkoku/tebiki/2025/03/order2/3-2_06.htm — exact 2025 salary table, including <=650,999 =>0; 651,000–1,899,999 => A−650,000; B=floor(A/4000)*1000 then B*2.8−80,000 below3.6m, B*3.2−440,000 below6.6m; below8.5m floor(A*0.9−1.1m); >=8.5m A−1.95m. Official example1,920,500=>1,264,000.
- https://www.nta.go.jp/taxes/shiraberu/taxanswer/shotoku/1000.htm — income minus deductions then tax schedule.
- https://www.nta.go.jp/taxes/shiraberu/taxanswer/shotoku/2260.htm — seven tax bands; taxable income truncation to1,000yen. Taxable zero displays rate0 as no tax, not a statutory eighth bracket. Income above330m is blocked because the additional minimum-tax regime is unsupported.
- https://www.nta.go.jp/publication/pamph/shotoku/fukko_tokubetsu/index.htm — user-selected full-income resident basis and2.1%.
- https://www.nta.go.jp/taxes/shiraberu/shinkoku/tebiki/2025/03/order4/3-4_45.htm — reconstruction surtax below1yen truncated. Official example176,500=>3,706.

Use BigInt integer arithmetic, validate digit-only input before conversion. Tax shown is before tax credits; under the declared no-credit scope this is the reconstruction base. Do not apply final payment100yen rounding to these intermediate results. Preserve missing vs zero. No refunds calculated from withholding yet. Test exact table boundaries, all rate thresholds, official examples, floor operations, inactive deduction drafts and live blank/invalid clearing.

## Manual resident deductions increment (2026-09-06)
User authorized separate income-tax and resident-tax deduction totals, separate per-item amounts with eligibility/premium conversion deferred, and manual combined adjustment credit. Use official name 所得控除（住民税用）, not an invented separate 住民控除 category. The adjustment help links Kyoto and explains tax-credit vs personal-deduction difference, city+prefecture sum, matching-year evidence, no blank-as-zero, and25m income exclusion.

calculateResident computes salary-only2026 taxable base with1000yen floor, 6%+4%pre-credit levy, then subtracts the manually entered combined adjustment credit. Reject credit above pre-credit levy or nonzero at salary-derived income>25m. Resident base can display before valid adjustment; levy stays unavailable. This is an intermediate amount before other credits, flat levy, forest tax, final100yen rounding and monthly allocation. User must be confirmed liable for income levy; exemption eligibility is not implemented. Both deduction modes have independent national/resident values; switching preserves drafts without summing inactive values. Resident totals cannot include donation or housing tax credits.

No cap calculation was introduced: manual combined adjustment credit does NOT determine personal-deduction difference or the special-credit rate uniquely. Would need verified rate basis, or explicit estimated-rate mode, to calculate a cap. Refund/furusato treatment/monthly bill remain deferred. National-tax formulas unchanged. Official Nakano2026case checks367500yen levy;11new+59existing assertions pass.

## 退税与月度住民税已接入（2026-09-06）

取代此前退税/捐款/最终住民税待接入的描述，新增 settlement.mjs。捐款前基线算法保持不变；下方按申报方式提供退税或补缴与标准住民税年度/月度概算。完整公式、官方来源和限制见 [settlement-rules.md](./settlement-rules.md)。

## 所得金額調整控除与房贷抵扣（2026-09-06追加）

已接入子女/特别残障类工资所得调整及按证明可能額的房贷抵税。工资所得调整先于两税所得扣除；房贷先于复兴税计算。当前权威公式、输入资格边界和断言见 [credits-rules.md](./credits-rules.md)，取代前文相关未支持描述；2025精确工资表版本不变。
