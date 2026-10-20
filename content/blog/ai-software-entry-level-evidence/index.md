---
title: AI 时代的软件工作：技术表述、经验门槛与人员流动
summary: >-
  招聘文本中的 AI
  相关表述增多，编程语言和技术栈却沿着不同方向变化。中美招聘中的前端与移动端标题占比下降，美国低经验要求减少；履历记录进一步呈现岗位资历与职业阶段之间的差别。
date: '2026-10-18'
updated: '2026-10-20'
draft: false
author: Yuxin
category: findings
lang: zh-CN
tags:
  - AI协作
  - 工作方式
  - 经济发展
---

<style>
.rw-figure{border:1px solid var(--rule,#d7d9d0);padding:20px;margin:32px 0;color:var(--ink,#28322f);background:var(--paper,#faf9f6)}.rw-figure-title{font-weight:650;font-size:1.05rem;line-height:1.5;margin-bottom:16px}.rw-figure svg{width:100%;height:auto;display:block;overflow:visible;font-family:inherit;font-size:17px;fill:currentColor}.rw-figure h3{font-size:1rem!important;margin:14px 0 4px!important}.rw-panels{display:grid;grid-template-columns:1fr 1fr;gap:24px}.rw-unit{font-size:.8rem!important;line-height:1.6!important;color:var(--muted,#626960);margin:8px 0!important}.rw-figure figcaption{font-size:.85rem;line-height:1.7;margin-top:18px}.rw-figure summary{cursor:pointer;font-size:.85rem;padding:12px 0;min-height:44px}.rw-figure details{border-top:1px solid var(--rule,#d7d9d0);margin-top:14px}.rw-hover{opacity:0;paint-order:stroke;stroke:var(--paper,#faf9f6);stroke-width:5px;stroke-linejoin:round;font-weight:600}.rw-point:hover .rw-hover,.rw-point:focus .rw-hover{opacity:1}.rw-point:focus{outline:2px solid #a54c34;outline-offset:4px}.rw-compare{display:grid;grid-template-columns:195px 1fr;gap:15px;align-items:center;margin:14px 0}.rw-compare strong{font-size:.85rem;line-height:1.6}.rw-compare span{display:block;font-weight:400;color:var(--muted,#626960)}.rw-bar-list{display:grid;gap:18px}.rw-bar-row{display:grid;grid-template-columns:145px 1fr;gap:12px;align-items:center}.rw-bar-row strong{font-size:.88rem;line-height:1.5}.rw-bar{position:relative;height:27px;padding-right:42px;margin:4px 0}.rw-bar i{display:block;height:15px;width:var(--value);background:var(--bar)}.rw-bar span{position:absolute;right:0;top:-5px;font-size:.82rem;font-variant-numeric:tabular-nums}.rw-figure .table-scroll{max-width:100%;overflow:auto}.rw-figure table{font-size:.83rem}.rw-figure th,.rw-figure td{padding:9px!important}.rw-figure .rw-panel{min-width:0}@media(max-width:600px){.rw-compare{grid-template-columns:1fr;gap:2px;margin:20px 0}.rw-compare strong{display:flex;justify-content:space-between;gap:8px;flex-wrap:wrap}.rw-figure{padding:12px}.rw-panels{grid-template-columns:1fr;gap:12px}.rw-bar-row{grid-template-columns:105px 1fr;gap:8px}.rw-bar-row strong{font-size:.8rem}.rw-figure svg{font-size:18px}.rw-figure figcaption{font-size:.8rem}}@media print{.rw-figure details{display:block}.rw-figure{break-inside:avoid}.rw-hover{display:none}}
</style>

## 软件工作的技能组合与进入条件

当 AI 开始参与编程，软件劳动市场正在改变什么：企业需要的技术、岗位的经验门槛，还是进入新工作的机会？

生成式 AI 进入软件开发后，劳动市场上同时出现了几种变化：招聘文本更常提及大模型相关知识，一些语言和技术方向的出现频率降低，企业对经验的要求也在调整。这些变化发生在同一时期，却对应不同问题。技术表述反映企业对工作内容和知识背景的描述；经验门槛反映这些工作向谁开放；任职开始记录则描述哪些人进入了新的职位。

本文使用 Revelio 招聘帖与职业履历数据，沿着这三层关系考察软件及相关计算机工作。最清楚的发现是需求构成的变化：美国招聘中的 AI 相关表述快速增加，Python 与 JavaScript/Node 的提及率分化；在可比较的中美来源组内，前端和移动端标题占比下降，ML/AI 标题占比上升。全栈标题则呈现波动，而非持续扩张。

进入工作的门槛呈现另一层变化。美国明确写出经验年限的招聘帖中，要求至多两年经验的比例降低。不过，企业内部的任职记录显示，按已有职业经历划分的新人，相对有经验者的位置与“初级岗位”标签给出的结果不同。理解这种差别，需要把**岗位处于什么层级**与**任职者走到职业生涯的哪一步**分开。

## 数据连接了技能、岗位与职业经历

Revelio 招聘数据汇集多个招聘平台与公司网站；职业履历数据来自公开在线职业档案，主要为 LinkedIn。技能描述覆盖计算机职业，包括软件开发、测试、网络、数据库、信息安全与 IT 支持。职业 AI 暴露的回归比较则覆盖更广泛的职业。[1]

本文使用五类主要测量：

| 测量 | 它回答的问题 | 本文的定义 |
| --- | --- | --- |
| 招聘帖 | 企业公开表达了哪些需求？ | 按发布时间统计的招聘记录，可描述数量、标题与要求 |
| 语言与技术栈 | 企业提及哪些技术、招聘哪类工作？ | 标题中的前端、全栈、移动端、ML/AI 等方向；描述中的语言、框架与大模型关键词。标签可重叠 |
| 经验与资历 | 岗位向谁开放，人员处于哪个阶段？ | 文本要求年限；Revelio 的岗位资历等级；任职开始时距最早已记录工作的年数 |
| 任职开始 | 履历中何时出现一个新职位？ | 按记录的开始日期计数；外部任职包括首次已记录任职和跨母公司的变动 |
| 职业 AI 暴露 | 哪些职业的任务更适合语言模型？ | 采用 Eloundou 等人的任务评分：语言模型及配套软件帮助完成任务、节省时间的潜力，按职业标准化[2] |

标题和描述指标均以全部抽样匹配记录为分母，每条记录对每项关键词标签最多计一次；描述中的提及率是观察到该关键词的匹配记录比例。语言和 AI 指标衡量招聘文本中的技术表述，岗位实际任务与人员流动由后面的证据补充。

## 招聘量经历回落与回升，计算机职业的份额仍较低

美国计算机职业的月均招聘帖在2022年达到130.75万，2024年回落到54.65万，2025年回升到87.48万。与此同时，这类职位占全部职业招聘帖的比例，由2022年的9.30%降至2025年的5.35%。观察到的变化同时包含一次明显的招聘周期，以及计算机工作在招聘构成中较低的份额。

| 年份 | 美国计算机职业月均招聘帖 | 占全部职业招聘帖（月度比例均值） |
| --- | ---: | ---: |
| 2021 | 65.87万 | 7.75% |
| 2022 | 130.75万 | 9.30% |
| 2023 | 68.38万 | 6.45% |
| 2024 | 54.65万 | 5.63% |
| 2025 | 87.48万 | 5.35% |

这些数字描述所覆盖平台的发帖活动。来源覆盖也在扩张，因此本文把总量作为背景，进一步观察同一类记录内部的技能与资历构成。这个转向很重要：招聘数量回升时，新增需求所寻找的技能和人员仍可能与此前不同。

## AI 相关表述增多，语言和框架的变化明显分化

美国招聘描述中，LLM／生成式 AI 术语的提及率，从2021年的0.02%升至2023年的0.53%、2025年的4.62%，到2026年前八个月达到7.21%。标题明确指向 ML/AI 的匹配记录占比，也从0.53%上升至4.91%。招聘描述中的 AI 相关表述更常见，同时，明确以 AI 命名的岗位在招聘构成中增多。这两个指标分别刻画较广泛的文本提及与标题明确标识的职业方向。

<figure class="rw-figure" id="rw-fig_ai"><div class="rw-figure-title">图 1 · AI 表述更加常见，明确命名的 AI 岗位占比也上升</div><div class="rw-panels"><section class="rw-panel"><h3>LLM / 生成式 AI 描述</h3><p class="rw-unit">提及率（%）</p><svg viewBox="0 0 360 240" role="img" aria-label="LLM / 生成式 AI 描述，2021至2026年前八月"><title>LLM / 生成式 AI 描述</title><line x1="44" x2="338" y1="190.0" y2="190.0" stroke="currentColor" opacity=".15"/><text x="36" y="195.0" text-anchor="end">0</text><line x1="44" x2="338" y1="110.9" y2="110.9" stroke="currentColor" opacity=".15"/><text x="36" y="115.9" text-anchor="end">4.1</text><line x1="44" x2="338" y1="29.8" y2="29.8" stroke="currentColor" opacity=".15"/><text x="36" y="34.8" text-anchor="end">8.3</text><polyline points="44.0,189.6 102.8,189.6 161.6,179.8 220.4,132.1 279.2,100.8 338.0,50.9" fill="none" stroke="#a54c34" stroke-width="3"/><g tabindex="0" class="rw-point" aria-label="2021年：0.02"><title>2021年：0.02</title><circle cx="44.0" cy="189.6" r="5" fill="#a54c34"/><text class="rw-hover" x="72.0" y="177.6" text-anchor="middle">0.02</text></g><text x="44.0" y="215" text-anchor="middle">21</text><g tabindex="0" class="rw-point" aria-label="2022年：0.02"><title>2022年：0.02</title><circle cx="102.8" cy="189.6" r="5" fill="#a54c34"/><text class="rw-hover" x="102.8" y="177.6" text-anchor="middle">0.02</text></g><text x="102.8" y="215" text-anchor="middle">22</text><g tabindex="0" class="rw-point" aria-label="2023年：0.53"><title>2023年：0.53</title><circle cx="161.6" cy="179.8" r="5" fill="#a54c34"/><text class="rw-hover" x="161.6" y="167.8" text-anchor="middle">0.53</text></g><text x="161.6" y="215" text-anchor="middle">23</text><g tabindex="0" class="rw-point" aria-label="2024年：3.00"><title>2024年：3.00</title><circle cx="220.4" cy="132.1" r="5" fill="#a54c34"/><text class="rw-hover" x="220.4" y="120.1" text-anchor="middle">3.00</text></g><text x="220.4" y="215" text-anchor="middle">24</text><g tabindex="0" class="rw-point" aria-label="2025年：4.62"><title>2025年：4.62</title><circle cx="279.2" cy="100.8" r="5" fill="#a54c34"/><text class="rw-hover" x="279.2" y="88.8" text-anchor="middle">4.62</text></g><text x="279.2" y="215" text-anchor="middle">25</text><g tabindex="0" class="rw-point" aria-label="2026年1—8月：7.21"><title>2026年1—8月：7.21</title><circle cx="338.0" cy="50.9" r="5" fill="#a54c34"/><text class="rw-hover" x="290.0" y="38.9" text-anchor="middle">7.21</text></g><text x="338.0" y="215" text-anchor="middle">26</text><text x="180" y="237" text-anchor="middle">年份（2026仅1—8月）</text></svg></section><section class="rw-panel"><h3>ML / AI 标题</h3><p class="rw-unit">占匹配帖子的百分比</p><svg viewBox="0 0 360 240" role="img" aria-label="ML / AI 标题，2021至2026年前八月"><title>ML / AI 标题</title><line x1="44" x2="338" y1="190.0" y2="190.0" stroke="currentColor" opacity=".15"/><text x="36" y="195.0" text-anchor="end">0</text><line x1="44" x2="338" y1="110.7" y2="110.7" stroke="currentColor" opacity=".15"/><text x="36" y="115.7" text-anchor="end">2.8</text><line x1="44" x2="338" y1="31.3" y2="31.3" stroke="currentColor" opacity=".15"/><text x="36" y="36.3" text-anchor="end">5.6</text><polyline points="44.0,175.0 102.8,173.8 161.6,169.9 220.4,118.9 279.2,103.0 338.0,50.9" fill="none" stroke="#2b7479" stroke-width="3"/><g tabindex="0" class="rw-point" aria-label="2021年：0.53"><title>2021年：0.53</title><circle cx="44.0" cy="175.0" r="5" fill="#2b7479"/><text class="rw-hover" x="72.0" y="163.0" text-anchor="middle">0.53</text></g><text x="44.0" y="215" text-anchor="middle">21</text><g tabindex="0" class="rw-point" aria-label="2022年：0.57"><title>2022年：0.57</title><circle cx="102.8" cy="173.8" r="5" fill="#2b7479"/><text class="rw-hover" x="102.8" y="161.8" text-anchor="middle">0.57</text></g><text x="102.8" y="215" text-anchor="middle">22</text><g tabindex="0" class="rw-point" aria-label="2023年：0.71"><title>2023年：0.71</title><circle cx="161.6" cy="169.9" r="5" fill="#2b7479"/><text class="rw-hover" x="161.6" y="157.9" text-anchor="middle">0.71</text></g><text x="161.6" y="215" text-anchor="middle">23</text><g tabindex="0" class="rw-point" aria-label="2024年：2.51"><title>2024年：2.51</title><circle cx="220.4" cy="118.9" r="5" fill="#2b7479"/><text class="rw-hover" x="220.4" y="106.9" text-anchor="middle">2.51</text></g><text x="220.4" y="215" text-anchor="middle">24</text><g tabindex="0" class="rw-point" aria-label="2025年：3.07"><title>2025年：3.07</title><circle cx="279.2" cy="103.0" r="5" fill="#2b7479"/><text class="rw-hover" x="279.2" y="91.0" text-anchor="middle">3.07</text></g><text x="279.2" y="215" text-anchor="middle">25</text><g tabindex="0" class="rw-point" aria-label="2026年1—8月：4.91"><title>2026年1—8月：4.91</title><circle cx="338.0" cy="50.9" r="5" fill="#2b7479"/><text class="rw-hover" x="290.0" y="38.9" text-anchor="middle">4.91</text></g><text x="338.0" y="215" text-anchor="middle">26</text><text x="180" y="237" text-anchor="middle">年份（2026仅1—8月）</text></svg></section></div><figcaption>美国计算机职业抽样招聘，2021—2026年1—8月。两面板均以全部匹配记录为分母：左为描述中LLM关键词的提及率，右为ML/AI标题占比。数据来源：Revelio招聘样本；指标定义见附录A。</figcaption><details><summary>查看图 1 的完整数据</summary><div class="table-scroll" tabindex="0" role="region" aria-label="图表数据，可横向滚动"><table><thead><tr><th scope="col">年份</th><th scope="col">LLM提及率（%）</th><th scope="col">ML/AI标题（%）</th></tr></thead><tbody><tr><th scope="row">2021</th><td>0.02</td><td>0.53</td></tr><tr><th scope="row">2022</th><td>0.02</td><td>0.57</td></tr><tr><th scope="row">2023</th><td>0.53</td><td>0.71</td></tr><tr><th scope="row">2024</th><td>3.00</td><td>2.51</td></tr><tr><th scope="row">2025</th><td>4.62</td><td>3.07</td></tr><tr><th scope="row">2026（1—8月）</th><td>7.21</td><td>4.91</td></tr></tbody></table></div></details></figure>

AI 表述增加的同时，语言之间呈现分化。2021年至2026年前八个月，Python 的提及率由13.56%升至19.05%，TypeScript由2.68%升至3.97%；JavaScript/Node由14.57%降至12.33%，Java由14.72%降至13.70%，C#/.NET由8.29%降至6.73%。Rust从0.31%升至0.87%，方向向上但仍处于较小规模。对语言生态的判断因而需要同时看变化方向与起始规模。

<figure class="rw-figure" id="rw-fig_lang"><div class="rw-figure-title">图 2 · 语言提及率的变化方向不同</div><p class="rw-unit">占全部匹配记录的百分比 · 灰：2021　蓝绿：2026年1—8月</p><div class="rw-bar-list"><div class="rw-bar-row"><strong>Python</strong><div><div class="rw-bar" style="--value:54.24%;--bar:#85877f"><span>13.56</span><i></i></div><div class="rw-bar" style="--value:76.2%;--bar:#2b7479"><span>19.05</span><i></i></div></div></div><div class="rw-bar-row"><strong>JavaScript / Node</strong><div><div class="rw-bar" style="--value:58.28%;--bar:#85877f"><span>14.57</span><i></i></div><div class="rw-bar" style="--value:49.32%;--bar:#2b7479"><span>12.33</span><i></i></div></div></div><div class="rw-bar-row"><strong>Java</strong><div><div class="rw-bar" style="--value:58.879999999999995%;--bar:#85877f"><span>14.72</span><i></i></div><div class="rw-bar" style="--value:54.79999999999999%;--bar:#2b7479"><span>13.70</span><i></i></div></div></div><div class="rw-bar-row"><strong>TypeScript</strong><div><div class="rw-bar" style="--value:10.72%;--bar:#85877f"><span>2.68</span><i></i></div><div class="rw-bar" style="--value:15.879999999999999%;--bar:#2b7479"><span>3.97</span><i></i></div></div></div><div class="rw-bar-row"><strong>C# / .NET</strong><div><div class="rw-bar" style="--value:33.16%;--bar:#85877f"><span>8.29</span><i></i></div><div class="rw-bar" style="--value:26.919999999999998%;--bar:#2b7479"><span>6.73</span><i></i></div></div></div><div class="rw-bar-row"><strong>Rust</strong><div><div class="rw-bar" style="--value:1.24%;--bar:#85877f"><span>0.31</span><i></i></div><div class="rw-bar" style="--value:3.4799999999999995%;--bar:#2b7479"><span>0.87</span><i></i></div></div></div></div><figcaption>美国计算机职业，2021与2026年1—8月；所有条形共用0—25刻度。单位为提及率（%），标签可重叠。Rust的增长发生在较小基数上。数据来源：Revelio招聘文本。</figcaption><details><summary>查看图 2 的完整数据</summary><div class="table-scroll" tabindex="0" role="region" aria-label="图表数据，可横向滚动"><table><thead><tr><th scope="col">语言</th><th scope="col">2021</th><th scope="col">2026年1—8月</th></tr></thead><tbody><tr><th scope="row">Python</th><td>13.56</td><td>19.05</td></tr><tr><th scope="row">JavaScript / Node</th><td>14.57</td><td>12.33</td></tr><tr><th scope="row">Java</th><td>14.72</td><td>13.70</td></tr><tr><th scope="row">TypeScript</th><td>2.68</td><td>3.97</td></tr><tr><th scope="row">C# / .NET</th><td>8.29</td><td>6.73</td></tr><tr><th scope="row">Rust</th><td>0.31</td><td>0.87</td></tr></tbody></table></div></details></figure>

框架的变化同样有差异。React提及率由7.62%降至5.79%，Angular由5.57%降至3.80%，Vue由1.54%降至0.98%。移动开发相关的 Kotlin 与 Swift 分别从0.97%、0.99%降至0.84%、0.72%。结合后文的前端与移动端标题变化，这些结果表明，面向网页和移动应用的部分技术表述在招聘文本中所占位置降低，而 AI 与部分数据相关表述更突出。

语言经常同时出现在一条招聘要求中。Python 可以服务于数据、后台与自动化工作，TypeScript 与 JavaScript 也可能共同出现。因此，这里的经济含义是**招聘文本中出现的技术组合发生变化**；某种语言对应的就业规模、工资回报与另一种语言之间的替代关系，仍是另外的研究问题。

## 中美都出现了前端、移动端占比下降与 AI 方向扩张

技术栈标题提供了比单个语言更接近工作方向的观察。在美国，全栈标题占比从2021年的3.21%变为2026年前八个月的2.74%，期间最高为2024年的3.86%，最低为2025年的2.44%。ML/AI 标题则从0.53%升至4.91%。因此，样本更鲜明地体现了 AI 方向的扩张；全栈岗位的份额在招聘周期中上下波动。

中美比较按来源组分别进行。中国使用招聘板来源，美国分别观察 LinkedIn-only 与 other。2022年上半年至2025年上半年，中国招聘板中的前端标题占比由8.4%降至4.5%，移动端由3.0%降至2.4%，ML/AI由0.9%升至3.4%。美国两个来源组在这三个方向上表现一致。

<figure class="rw-figure" id="rw-fig_stack"><div class="rw-figure-title">图 3 · 三类来源中的技术方向变化一致</div><p class="rw-unit">占各来源匹配帖子的百分比 · ○ 2022H1 → ● 2025H1</p><h3>前端</h3><div class="rw-compare"><strong>中国招聘板<span>8.4% → 4.5%</span></strong><svg viewBox="0 0 350 58" role="img" aria-label="中国招聘板：8.4% → 4.5%"><title>中国招聘板：8.4% → 4.5%</title><line x1="20.0" x2="20.0" y1="6" y2="30" stroke="currentColor" opacity=".15"/><text x="20.0" y="52" text-anchor="middle">0%</text><line x1="120.0" x2="120.0" y1="6" y2="30" stroke="currentColor" opacity=".15"/><text x="120.0" y="52" text-anchor="middle">3%</text><line x1="220.0" x2="220.0" y1="6" y2="30" stroke="currentColor" opacity=".15"/><text x="220.0" y="52" text-anchor="middle">6%</text><line x1="320.0" x2="320.0" y1="6" y2="30" stroke="currentColor" opacity=".15"/><text x="320.0" y="52" text-anchor="middle">9%</text><g tabindex="0" class="rw-point" aria-label="中国招聘板：8.4% → 4.5%"><title>中国招聘板：8.4% → 4.5%</title><line x1="300.0" x2="170.0" y1="18" y2="18" stroke="#2b7479" stroke-width="3"/><circle cx="300.0" cy="18" r="5" fill="var(--paper,#faf9f6)" stroke="#2b7479" stroke-width="2"/><circle cx="170.0" cy="18" r="5" fill="#2b7479"/></g></svg></div><div class="rw-compare"><strong>美国 LinkedIn-only<span>2.2% → 1.5%</span></strong><svg viewBox="0 0 350 58" role="img" aria-label="美国 LinkedIn-only：2.2% → 1.5%"><title>美国 LinkedIn-only：2.2% → 1.5%</title><line x1="20.0" x2="20.0" y1="6" y2="30" stroke="currentColor" opacity=".15"/><text x="20.0" y="52" text-anchor="middle">0%</text><line x1="120.0" x2="120.0" y1="6" y2="30" stroke="currentColor" opacity=".15"/><text x="120.0" y="52" text-anchor="middle">3%</text><line x1="220.0" x2="220.0" y1="6" y2="30" stroke="currentColor" opacity=".15"/><text x="220.0" y="52" text-anchor="middle">6%</text><line x1="320.0" x2="320.0" y1="6" y2="30" stroke="currentColor" opacity=".15"/><text x="320.0" y="52" text-anchor="middle">9%</text><g tabindex="0" class="rw-point" aria-label="美国 LinkedIn-only：2.2% → 1.5%"><title>美国 LinkedIn-only：2.2% → 1.5%</title><line x1="93.33333333333334" x2="70.0" y1="18" y2="18" stroke="#2b7479" stroke-width="3"/><circle cx="93.33333333333334" cy="18" r="5" fill="var(--paper,#faf9f6)" stroke="#2b7479" stroke-width="2"/><circle cx="70.0" cy="18" r="5" fill="#2b7479"/></g></svg></div><div class="rw-compare"><strong>美国 other<span>2.0% → 1.6%</span></strong><svg viewBox="0 0 350 58" role="img" aria-label="美国 other：2.0% → 1.6%"><title>美国 other：2.0% → 1.6%</title><line x1="20.0" x2="20.0" y1="6" y2="30" stroke="currentColor" opacity=".15"/><text x="20.0" y="52" text-anchor="middle">0%</text><line x1="120.0" x2="120.0" y1="6" y2="30" stroke="currentColor" opacity=".15"/><text x="120.0" y="52" text-anchor="middle">3%</text><line x1="220.0" x2="220.0" y1="6" y2="30" stroke="currentColor" opacity=".15"/><text x="220.0" y="52" text-anchor="middle">6%</text><line x1="320.0" x2="320.0" y1="6" y2="30" stroke="currentColor" opacity=".15"/><text x="320.0" y="52" text-anchor="middle">9%</text><g tabindex="0" class="rw-point" aria-label="美国 other：2.0% → 1.6%"><title>美国 other：2.0% → 1.6%</title><line x1="86.66666666666666" x2="73.33333333333334" y1="18" y2="18" stroke="#2b7479" stroke-width="3"/><circle cx="86.66666666666666" cy="18" r="5" fill="var(--paper,#faf9f6)" stroke="#2b7479" stroke-width="2"/><circle cx="73.33333333333334" cy="18" r="5" fill="#2b7479"/></g></svg></div><h3>移动端</h3><div class="rw-compare"><strong>中国招聘板<span>3.0% → 2.4%</span></strong><svg viewBox="0 0 350 58" role="img" aria-label="中国招聘板：3.0% → 2.4%"><title>中国招聘板：3.0% → 2.4%</title><line x1="20.0" x2="20.0" y1="6" y2="30" stroke="currentColor" opacity=".15"/><text x="20.0" y="52" text-anchor="middle">0%</text><line x1="120.0" x2="120.0" y1="6" y2="30" stroke="currentColor" opacity=".15"/><text x="120.0" y="52" text-anchor="middle">3%</text><line x1="220.0" x2="220.0" y1="6" y2="30" stroke="currentColor" opacity=".15"/><text x="220.0" y="52" text-anchor="middle">6%</text><line x1="320.0" x2="320.0" y1="6" y2="30" stroke="currentColor" opacity=".15"/><text x="320.0" y="52" text-anchor="middle">9%</text><g tabindex="0" class="rw-point" aria-label="中国招聘板：3.0% → 2.4%"><title>中国招聘板：3.0% → 2.4%</title><line x1="120.0" x2="100.0" y1="18" y2="18" stroke="#2b7479" stroke-width="3"/><circle cx="120.0" cy="18" r="5" fill="var(--paper,#faf9f6)" stroke="#2b7479" stroke-width="2"/><circle cx="100.0" cy="18" r="5" fill="#2b7479"/></g></svg></div><div class="rw-compare"><strong>美国 LinkedIn-only<span>2.7% → 1.3%</span></strong><svg viewBox="0 0 350 58" role="img" aria-label="美国 LinkedIn-only：2.7% → 1.3%"><title>美国 LinkedIn-only：2.7% → 1.3%</title><line x1="20.0" x2="20.0" y1="6" y2="30" stroke="currentColor" opacity=".15"/><text x="20.0" y="52" text-anchor="middle">0%</text><line x1="120.0" x2="120.0" y1="6" y2="30" stroke="currentColor" opacity=".15"/><text x="120.0" y="52" text-anchor="middle">3%</text><line x1="220.0" x2="220.0" y1="6" y2="30" stroke="currentColor" opacity=".15"/><text x="220.0" y="52" text-anchor="middle">6%</text><line x1="320.0" x2="320.0" y1="6" y2="30" stroke="currentColor" opacity=".15"/><text x="320.0" y="52" text-anchor="middle">9%</text><g tabindex="0" class="rw-point" aria-label="美国 LinkedIn-only：2.7% → 1.3%"><title>美国 LinkedIn-only：2.7% → 1.3%</title><line x1="110.00000000000001" x2="63.333333333333336" y1="18" y2="18" stroke="#2b7479" stroke-width="3"/><circle cx="110.00000000000001" cy="18" r="5" fill="var(--paper,#faf9f6)" stroke="#2b7479" stroke-width="2"/><circle cx="63.333333333333336" cy="18" r="5" fill="#2b7479"/></g></svg></div><div class="rw-compare"><strong>美国 other<span>1.8% → 1.2%</span></strong><svg viewBox="0 0 350 58" role="img" aria-label="美国 other：1.8% → 1.2%"><title>美国 other：1.8% → 1.2%</title><line x1="20.0" x2="20.0" y1="6" y2="30" stroke="currentColor" opacity=".15"/><text x="20.0" y="52" text-anchor="middle">0%</text><line x1="120.0" x2="120.0" y1="6" y2="30" stroke="currentColor" opacity=".15"/><text x="120.0" y="52" text-anchor="middle">3%</text><line x1="220.0" x2="220.0" y1="6" y2="30" stroke="currentColor" opacity=".15"/><text x="220.0" y="52" text-anchor="middle">6%</text><line x1="320.0" x2="320.0" y1="6" y2="30" stroke="currentColor" opacity=".15"/><text x="320.0" y="52" text-anchor="middle">9%</text><g tabindex="0" class="rw-point" aria-label="美国 other：1.8% → 1.2%"><title>美国 other：1.8% → 1.2%</title><line x1="80.0" x2="60.0" y1="18" y2="18" stroke="#2b7479" stroke-width="3"/><circle cx="80.0" cy="18" r="5" fill="var(--paper,#faf9f6)" stroke="#2b7479" stroke-width="2"/><circle cx="60.0" cy="18" r="5" fill="#2b7479"/></g></svg></div><h3>ML/AI</h3><div class="rw-compare"><strong>中国招聘板<span>0.9% → 3.4%</span></strong><svg viewBox="0 0 350 58" role="img" aria-label="中国招聘板：0.9% → 3.4%"><title>中国招聘板：0.9% → 3.4%</title><line x1="20.0" x2="20.0" y1="6" y2="30" stroke="currentColor" opacity=".15"/><text x="20.0" y="52" text-anchor="middle">0%</text><line x1="120.0" x2="120.0" y1="6" y2="30" stroke="currentColor" opacity=".15"/><text x="120.0" y="52" text-anchor="middle">3%</text><line x1="220.0" x2="220.0" y1="6" y2="30" stroke="currentColor" opacity=".15"/><text x="220.0" y="52" text-anchor="middle">6%</text><line x1="320.0" x2="320.0" y1="6" y2="30" stroke="currentColor" opacity=".15"/><text x="320.0" y="52" text-anchor="middle">9%</text><g tabindex="0" class="rw-point" aria-label="中国招聘板：0.9% → 3.4%"><title>中国招聘板：0.9% → 3.4%</title><line x1="50.0" x2="133.33333333333331" y1="18" y2="18" stroke="#2b7479" stroke-width="3"/><circle cx="50.0" cy="18" r="5" fill="var(--paper,#faf9f6)" stroke="#2b7479" stroke-width="2"/><circle cx="133.33333333333331" cy="18" r="5" fill="#2b7479"/></g></svg></div><div class="rw-compare"><strong>美国 LinkedIn-only<span>0.5% → 2.8%</span></strong><svg viewBox="0 0 350 58" role="img" aria-label="美国 LinkedIn-only：0.5% → 2.8%"><title>美国 LinkedIn-only：0.5% → 2.8%</title><line x1="20.0" x2="20.0" y1="6" y2="30" stroke="currentColor" opacity=".15"/><text x="20.0" y="52" text-anchor="middle">0%</text><line x1="120.0" x2="120.0" y1="6" y2="30" stroke="currentColor" opacity=".15"/><text x="120.0" y="52" text-anchor="middle">3%</text><line x1="220.0" x2="220.0" y1="6" y2="30" stroke="currentColor" opacity=".15"/><text x="220.0" y="52" text-anchor="middle">6%</text><line x1="320.0" x2="320.0" y1="6" y2="30" stroke="currentColor" opacity=".15"/><text x="320.0" y="52" text-anchor="middle">9%</text><g tabindex="0" class="rw-point" aria-label="美国 LinkedIn-only：0.5% → 2.8%"><title>美国 LinkedIn-only：0.5% → 2.8%</title><line x1="36.666666666666664" x2="113.33333333333333" y1="18" y2="18" stroke="#2b7479" stroke-width="3"/><circle cx="36.666666666666664" cy="18" r="5" fill="var(--paper,#faf9f6)" stroke="#2b7479" stroke-width="2"/><circle cx="113.33333333333333" cy="18" r="5" fill="#2b7479"/></g></svg></div><div class="rw-compare"><strong>美国 other<span>0.6% → 2.5%</span></strong><svg viewBox="0 0 350 58" role="img" aria-label="美国 other：0.6% → 2.5%"><title>美国 other：0.6% → 2.5%</title><line x1="20.0" x2="20.0" y1="6" y2="30" stroke="currentColor" opacity=".15"/><text x="20.0" y="52" text-anchor="middle">0%</text><line x1="120.0" x2="120.0" y1="6" y2="30" stroke="currentColor" opacity=".15"/><text x="120.0" y="52" text-anchor="middle">3%</text><line x1="220.0" x2="220.0" y1="6" y2="30" stroke="currentColor" opacity=".15"/><text x="220.0" y="52" text-anchor="middle">6%</text><line x1="320.0" x2="320.0" y1="6" y2="30" stroke="currentColor" opacity=".15"/><text x="320.0" y="52" text-anchor="middle">9%</text><g tabindex="0" class="rw-point" aria-label="美国 other：0.6% → 2.5%"><title>美国 other：0.6% → 2.5%</title><line x1="40.0" x2="103.33333333333334" y1="18" y2="18" stroke="#2b7479" stroke-width="3"/><circle cx="40.0" cy="18" r="5" fill="var(--paper,#faf9f6)" stroke="#2b7479" stroke-width="2"/><circle cx="103.33333333333334" cy="18" r="5" fill="#2b7479"/></g></svg></div><figcaption>计算机职业标题，2022H1与2025H1。中国招聘板为招聘板标记存在且无LinkedIn标记的来源组；美国两类来源分别统计。每一行的分母为该来源全部匹配帖子，标题标签可重叠。数据来源：Revelio招聘文本。</figcaption><details><summary>查看图 3 的完整数据</summary><div class="table-scroll" tabindex="0" role="region" aria-label="图表数据，可横向滚动"><table><thead><tr><th scope="col">方向</th><th scope="col">来源</th><th scope="col">2022H1（%）</th><th scope="col">2025H1（%）</th></tr></thead><tbody><tr><th scope="row">前端</th><td>中国招聘板</td><td>8.4</td><td>4.5</td></tr><tr><th scope="row">前端</th><td>美国 LinkedIn-only</td><td>2.2</td><td>1.5</td></tr><tr><th scope="row">前端</th><td>美国 other</td><td>2.0</td><td>1.6</td></tr><tr><th scope="row">移动端</th><td>中国招聘板</td><td>3.0</td><td>2.4</td></tr><tr><th scope="row">移动端</th><td>美国 LinkedIn-only</td><td>2.7</td><td>1.3</td></tr><tr><th scope="row">移动端</th><td>美国 other</td><td>1.8</td><td>1.2</td></tr><tr><th scope="row">ML/AI</th><td>中国招聘板</td><td>0.9</td><td>3.4</td></tr><tr><th scope="row">ML/AI</th><td>美国 LinkedIn-only</td><td>0.5</td><td>2.8</td></tr><tr><th scope="row">ML/AI</th><td>美国 other</td><td>0.6</td><td>2.5</td></tr></tbody></table></div></details></figure>

这种共同方向说明，招聘构成的变化并非只出现在某一个国家的合并序列中。与此同时，前端标题在中国来源中的起始占比更高，美国许多职位以泛化的“Software Engineer”命名。因而图中最有信息的比较，是各来源内部工作方向的变化，而非将两国标题比例直接视作职业结构的同一把尺子。

将视野从技术标题扩大到所有职业，中美来源中的招聘变化呈现不同的时间轨迹。中国招聘板中，高 AI 暴露职业相对于低暴露职业的走弱，在2023年前已经开始；美国 LinkedIn-only 来源在2023年后呈现相对走弱，随后到2025年上半年部分回升。技术标题构成相似的变化方向，可以与不同的职业招聘轨迹并存。附录 B 列出各期系数、标准误和比较口径。

对中国编程语言也有合并来源的描述统计，完整列于附录 A。例如2021至2024年，JavaScript/Node提及率由9.10%降至4.56%，Python由4.51%降至3.37%。中国描述文本的可用程度与来源构成都随时间变化，跨国主图因此使用按来源组分别比较的标题指标。2025年下半年以后的中国数据经历大幅来源更替，跨国主比较止于2025年上半年。

## 招聘要求向更多经验倾斜，岗位层级与职业阶段各有含义

美国计算机职业中，明确写出经验数字的招聘帖，要求至多两年的比例在下降。LinkedIn-only 来源从2022年下半年的16.4%降至2025年上半年的12.1%；other来源从21.7%降至15.3%。换成直观的表述：每100条写明经验年限的帖子，低年限要求分别减少约4条和6条。这反映了可观察招聘要求中向更多经验倾斜的构成变化。

| 来源 | 2022H2：要求≤2年 | 2025H1：要求≤2年 | 分母 |
| --- | ---: | ---: | --- |
| 美国 LinkedIn-only | 16.4% | 12.1% | 识别到经验年限的帖子 |
| 美国 other | 21.7% | 15.3% | 识别到经验年限的帖子 |

岗位标签也呈现资历结构变化。美国全栈标题内部，被标为1–2级的比例从2021年的64.95%降至2026年前八个月的31.78%；前端内部为58.62%至47.20%，后端内部为45.04%至18.00%。全栈岗位总份额的波动与其中低资历标签占比的下降，可以同时发生：**“招聘哪种工作”与“这种工作招什么层级的人”是两个维度。**

份额还受其他组别变化影响。2023年美国初级标签占比从第一季度37.0%升至第四季度47.5%，同期初级帖数却从96.6万降至80.6万，3级帖数从91.6万降至39.6万。初级份额回升伴随两组数量下降，较高组别收缩更快。这个例子也为履历结果中的“相对改善”提供了直观解释。

转向个人经历时，岗位层级与职业阶段的区别更加突出。资历1–2级的外部任职记录中，33.7%的任职者距最早已记录工作不足三年，24.1%处于三至六年，42.2%已至少六年。岗位标签混合了不同职业阶段的人群。研究新人机会时，本文进一步按任职者自己的经历分组。

## 高暴露职业的招聘帖相对走弱，幅度超过任职记录

招聘帖表达企业对外公布的用人需求，任职开始记录人员进入职位的活动。把二者放在同一个企业、同一种职业和同一时期内比较，可以观察需求表达与人员流动是否同步。

美国61,054家企业、744个职业的比较显示：2023年上半年至2025年上半年，相对2021—2022年，AI 暴露更高的职业呈现更负的招聘帖变化，任职开始的负向变化较小。对于资历1–2级记录，每提高一个标准差的职业暴露，招聘帖的加一对数系数为−0.108，任职开始为−0.035；二者差值为+0.073。图中给出同一设计下的估计与常规95%区间。

<figure class="rw-figure" id="rw-fig_gap"><div class="rw-figure-title">图 4 · 高暴露职业的招聘帖相对走弱，幅度超过任职记录</div><div class="rw-compare"><strong>招聘帖（1–2级）<span>-0.108（SE 0.016）</span></strong><svg viewBox="0 0 350 65" role="img" aria-label="招聘帖（1–2级）：-0.108，标准误0.016，区间[-0.139,-0.077]"><title>招聘帖（1–2级）：-0.108，标准误0.016，区间[-0.139,-0.077]</title><line x1="20.0" x2="20.0" y1="5" y2="37" stroke="currentColor" opacity=".2"/><text x="20.0" y="58" text-anchor="middle">-0.15</text><line x1="186.66666666666663" x2="186.66666666666663" y1="5" y2="37" stroke="currentColor" opacity=".2"/><text x="186.66666666666663" y="58" text-anchor="middle">+0.00</text><line x1="320.0" x2="320.0" y1="5" y2="37" stroke="currentColor" opacity=".2"/><text x="320.0" y="58" text-anchor="middle">+0.12</text><g tabindex="0" class="rw-point" aria-label="招聘帖（1–2级）：-0.108，标准误0.016，区间[-0.139,-0.077]"><title>招聘帖（1–2级）：-0.108，标准误0.016，区间[-0.139,-0.077]</title><line x1="31.822222222222234" x2="101.5111111111111" y1="22" y2="22" stroke="#2b7479" stroke-width="3"/><circle cx="66.66666666666666" cy="22" r="6" fill="#2b7479"/></g></svg></div><div class="rw-compare"><strong>任职开始（1–2级）<span>-0.035（SE 0.009）</span></strong><svg viewBox="0 0 350 65" role="img" aria-label="任职开始（1–2级）：-0.035，标准误0.009，区间[-0.053,-0.017]"><title>任职开始（1–2级）：-0.035，标准误0.009，区间[-0.053,-0.017]</title><line x1="20.0" x2="20.0" y1="5" y2="37" stroke="currentColor" opacity=".2"/><text x="20.0" y="58" text-anchor="middle">-0.15</text><line x1="186.66666666666663" x2="186.66666666666663" y1="5" y2="37" stroke="currentColor" opacity=".2"/><text x="186.66666666666663" y="58" text-anchor="middle">+0.00</text><line x1="320.0" x2="320.0" y1="5" y2="37" stroke="currentColor" opacity=".2"/><text x="320.0" y="58" text-anchor="middle">+0.12</text><g tabindex="0" class="rw-point" aria-label="任职开始（1–2级）：-0.035，标准误0.009，区间[-0.053,-0.017]"><title>任职开始（1–2级）：-0.035，标准误0.009，区间[-0.053,-0.017]</title><line x1="128.17777777777775" x2="167.37777777777777" y1="22" y2="22" stroke="#2b7479" stroke-width="3"/><circle cx="147.77777777777777" cy="22" r="6" fill="#2b7479"/></g></svg></div><div class="rw-compare"><strong>任职减招聘的对数差<span>+0.073（SE 0.011）</span></strong><svg viewBox="0 0 350 65" role="img" aria-label="任职减招聘的对数差：+0.073，标准误0.011，区间[+0.051,+0.095]"><title>任职减招聘的对数差：+0.073，标准误0.011，区间[+0.051,+0.095]</title><line x1="20.0" x2="20.0" y1="5" y2="37" stroke="currentColor" opacity=".2"/><text x="20.0" y="58" text-anchor="middle">-0.15</text><line x1="186.66666666666663" x2="186.66666666666663" y1="5" y2="37" stroke="currentColor" opacity=".2"/><text x="186.66666666666663" y="58" text-anchor="middle">+0.00</text><line x1="320.0" x2="320.0" y1="5" y2="37" stroke="currentColor" opacity=".2"/><text x="320.0" y="58" text-anchor="middle">+0.12</text><g tabindex="0" class="rw-point" aria-label="任职减招聘的对数差：+0.073，标准误0.011，区间[+0.051,+0.095]"><title>任职减招聘的对数差：+0.073，标准误0.011，区间[+0.051,+0.095]</title><line x1="243.8222222222222" x2="291.7333333333333" y1="22" y2="22" stroke="#2b7479" stroke-width="3"/><circle cx="267.7777777777777" cy="22" r="6" fill="#2b7479"/></g></svg></div><figcaption>美国61,054家企业、744职业。比较2023H1—2025H1与2021H1—2022H2；控制企业×职业、企业×半年差异。点为每1标准差暴露的加一对数计数系数，线为职业聚类近似95%区间。第三行是前两者的代数对比。数据来源：Revelio招聘与任职记录。</figcaption><details><summary>查看图 4 的完整数据</summary><div class="table-scroll" tabindex="0" role="region" aria-label="图表数据，可横向滚动"><table><thead><tr><th scope="col">结果</th><th scope="col">系数</th><th scope="col">标准误</th></tr></thead><tbody><tr><th scope="row">招聘帖（1–2级）</th><td>-0.108</td><td>0.016</td></tr><tr><th scope="row">任职开始（1–2级）</th><td>-0.035</td><td>0.009</td></tr><tr><th scope="row">任职减招聘的对数差</th><td>0.073</td><td>0.011</td></tr></tbody></table></div></details></figure>

较高资历的3–4级也有相似背离：任职与招聘的对数差系数为+0.082；两组差值直接估计为−0.008，标准误0.010。结果指向一种更普遍的现象：**公开发帖活动与履历中的职位流动，对这段时期职业变化的反映程度不同。** 这关系到怎样理解市场冷热——在这一条件比较中，只观察招聘广告，会得到更强的相对走弱信号。

这里的任职开始包含内部换岗，与招聘帖也没有逐一配对。因此两者的差值用于描述记录之间的相对变化。下一步将视角收窄到首次已记录任职和跨公司流动，以更直接地观察进入新雇主的职业机会。

## 职业早期人员的相对位置，与经验者较弱的外部流动相伴

外部任职分析按用户抽取五分之一，比较美国所选企业中，职业早期人员与更有经验者的任职开始。核心问题是：在同一家企业内，AI 暴露较高的职业，新人相对于经验者的变化，是否比暴露较低的职业更弱？比较同时调整企业对不同经历组的总体用人变化，以及企业各职业共同面对的时期变化。

以距最早已记录任职不足三年定义职业早期，2023H1—2025H1相对2019H1—2022H2的系数为+0.028，标准误0.007；按教育结束时间为+0.026，按首次已记录任职为+0.043。相应的条件比较呈现新人更强的相对位置。资历1–2级相对3–4级的估计为−0.018，这一规格对应另一套记录范围和比较组。

<figure class="rw-figure" id="rw-fig_career"><div class="rw-figure-title">图 5 · 经历口径与岗位标签呈现不同相对变化</div><div class="rw-compare"><strong>任职经历不足三年<span>+0.028（SE 0.007）</span></strong><svg viewBox="0 0 350 65" role="img" aria-label="任职经历不足三年：+0.028，标准误0.007，区间[+0.014,+0.042]"><title>任职经历不足三年：+0.028，标准误0.007，区间[+0.014,+0.042]</title><line x1="20.0" x2="20.0" y1="5" y2="37" stroke="currentColor" opacity=".2"/><text x="20.0" y="58" text-anchor="middle">-0.05</text><line x1="135.3846153846154" x2="135.3846153846154" y1="5" y2="37" stroke="currentColor" opacity=".2"/><text x="135.3846153846154" y="58" text-anchor="middle">+0.00</text><line x1="320.0" x2="320.0" y1="5" y2="37" stroke="currentColor" opacity=".2"/><text x="320.0" y="58" text-anchor="middle">+0.08</text><g tabindex="0" class="rw-point" aria-label="任职经历不足三年：+0.028，标准误0.007，区间[+0.014,+0.042]"><title>任职经历不足三年：+0.028，标准误0.007，区间[+0.014,+0.042]</title><line x1="168.33846153846153" x2="231.66153846153844" y1="22" y2="22" stroke="#2b7479" stroke-width="3"/><circle cx="200.0" cy="22" r="6" fill="#2b7479"/></g></svg></div><div class="rw-compare"><strong>教育结束不足三年<span>+0.026（SE 0.007）</span></strong><svg viewBox="0 0 350 65" role="img" aria-label="教育结束不足三年：+0.026，标准误0.007，区间[+0.012,+0.040]"><title>教育结束不足三年：+0.026，标准误0.007，区间[+0.012,+0.040]</title><line x1="20.0" x2="20.0" y1="5" y2="37" stroke="currentColor" opacity=".2"/><text x="20.0" y="58" text-anchor="middle">-0.05</text><line x1="135.3846153846154" x2="135.3846153846154" y1="5" y2="37" stroke="currentColor" opacity=".2"/><text x="135.3846153846154" y="58" text-anchor="middle">+0.00</text><line x1="320.0" x2="320.0" y1="5" y2="37" stroke="currentColor" opacity=".2"/><text x="320.0" y="58" text-anchor="middle">+0.08</text><g tabindex="0" class="rw-point" aria-label="教育结束不足三年：+0.026，标准误0.007，区间[+0.012,+0.040]"><title>教育结束不足三年：+0.026，标准误0.007，区间[+0.012,+0.040]</title><line x1="163.72307692307692" x2="227.04615384615383" y1="22" y2="22" stroke="#2b7479" stroke-width="3"/><circle cx="195.38461538461536" cy="22" r="6" fill="#2b7479"/></g></svg></div><div class="rw-compare"><strong>首次已记录任职<span>+0.043（SE 0.009）</span></strong><svg viewBox="0 0 350 65" role="img" aria-label="首次已记录任职：+0.043，标准误0.009，区间[+0.025,+0.061]"><title>首次已记录任职：+0.043，标准误0.009，区间[+0.025,+0.061]</title><line x1="20.0" x2="20.0" y1="5" y2="37" stroke="currentColor" opacity=".2"/><text x="20.0" y="58" text-anchor="middle">-0.05</text><line x1="135.3846153846154" x2="135.3846153846154" y1="5" y2="37" stroke="currentColor" opacity=".2"/><text x="135.3846153846154" y="58" text-anchor="middle">+0.00</text><line x1="320.0" x2="320.0" y1="5" y2="37" stroke="currentColor" opacity=".2"/><text x="320.0" y="58" text-anchor="middle">+0.08</text><g tabindex="0" class="rw-point" aria-label="首次已记录任职：+0.043，标准误0.009，区间[+0.025,+0.061]"><title>首次已记录任职：+0.043，标准误0.009，区间[+0.025,+0.061]</title><line x1="193.9076923076923" x2="275.3230769230769" y1="22" y2="22" stroke="#2b7479" stroke-width="3"/><circle cx="234.6153846153846" cy="22" r="6" fill="#2b7479"/></g></svg></div><div class="rw-compare"><strong>资历标签1–2级<span>-0.018（SE 0.008）</span></strong><svg viewBox="0 0 350 65" role="img" aria-label="资历标签1–2级：-0.018，标准误0.008，区间[-0.034,-0.002]"><title>资历标签1–2级：-0.018，标准误0.008，区间[-0.034,-0.002]</title><line x1="20.0" x2="20.0" y1="5" y2="37" stroke="currentColor" opacity=".2"/><text x="20.0" y="58" text-anchor="middle">-0.05</text><line x1="135.3846153846154" x2="135.3846153846154" y1="5" y2="37" stroke="currentColor" opacity=".2"/><text x="135.3846153846154" y="58" text-anchor="middle">+0.00</text><line x1="320.0" x2="320.0" y1="5" y2="37" stroke="currentColor" opacity=".2"/><text x="320.0" y="58" text-anchor="middle">+0.08</text><g tabindex="0" class="rw-point" aria-label="资历标签1–2级：-0.018，标准误0.008，区间[-0.034,-0.002]"><title>资历标签1–2级：-0.018，标准误0.008，区间[-0.034,-0.002]</title><line x1="57.66153846153846" x2="130.03076923076924" y1="22" y2="22" stroke="#2b7479" stroke-width="3"/><circle cx="93.84615384615384" cy="22" r="6" fill="#2b7479"/></g></svg></div><figcaption>美国1/5用户抽样的外部任职；估计前筛选102,115个企业×职业组合。合并窗口2019H1—2025H1，后期从2023H1开始。不同操作性定义对应不同记录与比较样本。单位为每1标准差暴露的新人组相对加一对数系数；线为职业聚类近似95%区间。数据来源：Revelio职业履历。</figcaption><details><summary>查看图 5 的完整数据</summary><div class="table-scroll" tabindex="0" role="region" aria-label="图表数据，可横向滚动"><table><thead><tr><th scope="col">新人分组</th><th scope="col">系数</th><th scope="col">标准误</th></tr></thead><tbody><tr><th scope="row">任职经历不足三年</th><td>0.028</td><td>0.007</td></tr><tr><th scope="row">教育结束不足三年</th><td>0.026</td><td>0.007</td></tr><tr><th scope="row">首次已记录任职</th><td>0.043</td><td>0.009</td></tr><tr><th scope="row">资历标签1–2级</th><td>-0.018</td><td>0.008</td></tr></tbody></table></div></details></figure>

对相对位置的理解，可以结合分组结果。按任职经历划分，新人组单独估计的系数为−0.001，经验者为−0.030，标准误分别为0.006和0.007。这与**经验者外部流动更弱、新人相对位置较强**的情形相容。分组模型与上述相对比较的控制项不同，这里用它帮助理解经济含义。

这些结果把讨论从单一的“初级岗位减少”推进到更具体的问题：哪些工作层级在收缩，哪些职业阶段的人正在进入新公司，以及人员是否更多地留在现有职位。当前证据已经区分了岗位层级和职业阶段；同一批记录上逐项改变定义、比较组与模型的分解，以及对留任、工资和离职的研究，将进一步说明这些现象如何联系。

## AI 产品节点前后，技能表达与岗位层级呈现不同变化

产品发布为观察时间提供了清楚的坐标。Copilot于2022年6月全面开放，ChatGPT于同年11月推出，Claude Code于2025年5月全面开放。[3] 比较各事件前后四个完整季度的季度提及率均值，美国招聘中的 LLM 术语提及率分别增加0.07、0.58和2.75个百分点；初级资历标签占比分别下降7.73、3.40和2.96个百分点。事件所在季度从比较中剔除。

| 日历节点 | 比较前的四季度 | 比较后的四季度 | 美国 LLM 提及率变化（百分点） | 美国初级标签占比变化 |
| --- | --- | --- | ---: | ---: |
| Copilot 全面开放 | 2021Q2—2022Q1 | 2022Q3—2023Q2 | +0.07 | −7.73个百分点 |
| ChatGPT 推出 | 2021Q4—2022Q3 | 2023Q1—2023Q4 | +0.58 | −3.40个百分点 |
| Claude Code 全面开放 | 2024Q2—2025Q1 | 2025Q3—2026Q2 | +2.75 | −2.96个百分点 |

这组时间比较最突出的信息，是后一个窗口中大模型术语提及率的增幅更大，而初级标签占比的下降早已发生。语言指标也显示不同变化：ChatGPT节点前后，Python、JavaScript/Node和Java分别变化−0.06、−2.16、−1.38个百分点；Claude Code节点前后则分别为+0.08、+1.59、−3.81个百分点。两个窗口中Python的变化均接近零。年度首尾的趋势，与某个产品节点附近的变化，描述的是不同时间尺度。

表中是日历窗口的描述性比较。它把技能变化放进技术发展的时序，提供的是进一步研究企业采用过程的线索。对GPT-4、DeepSeek及OpenClaw等其他节点，现有证据尚未给出分别对应的、可比较的影响估计。尤其中国后期来源转换与产品传播时期重叠，对这些新节点的跨国比较仍需要连续的观测来源。

## 从“软件工作总量”转向“工作内容与进入路径”

这些证据呈现出一幅有层次的图景。AI 相关表述在招聘中更加常见，传统语言与框架的变化各异；中美来源内的前端、移动端与 AI 标题显示共同的构成方向。经验要求的变化进一步表明，技术方向与进入门槛可以同时调整。

从招聘文本走向职业履历后，结论变得更具体：公开发帖与职位流动的变化程度不同，岗位的初级标签与个人的职业早期也对应不同人群。按职业经历进行的条件比较，呈现新人较强的相对位置，并伴随经验者较弱的外部流动。这些观察将后续研究引向任务重组、企业内部配置与进入路径的变化，而 AI 对这些过程的独立作用，需要围绕实际采用与人员完整经历继续识别。

## 研究局限与进一步研究

**第一，技能构成怎样转化为全市场工作机会？** 平台覆盖、发帖习惯、文本可用程度和关键词写法都会改变记录。提及率衡量全部匹配记录中观察到的表达；美国较长描述的覆盖率由2021年的83.87%升至2026年前八月的99.24%，中国则由2021年的70.02%降至2024年的53.97%。文本可用程度的变化可能贡献于提及率变化。全市场空缺、同一岗位的技能调整、实际工具使用和技能工资回报仍需其他数据。

**第二，低经验机会的变化集中在哪些人？** 年限要求来自写明数字的招聘帖；这类帖子的占比也在变。岗位资历为预测标签，职业年限依赖履历完整性。中国部分平台的资历标签曾在很短时间内大幅跳变，而标题关键词较稳定。职业起点的人工验证及技能×经验的联合分析，将帮助把岗位分层与个人机会连接起来。

**第三，人员流动中有多少变化可以归因于 AI？** 任务暴露衡量技术适用潜力，实际采用时间与使用强度尚未直接观察；招聘周期及其他组织变化也可能与暴露相关。若干回归中，高低暴露职业在2023年前已经有不同变化。允许这类差异延续后，职业早期模型2023H1—2025H1平均系数的95%区间，从常规的[0.023,0.047]扩展为[−0.019,0.095]（具体趋势约束见附录 C）。因果方向和幅度仍取决于更有说服力的采用比较与趋势假设。

**第四，近期新人记录能否完整呈现进入工作的过程？** 履历更新存在滞后，2025年的首次任职尤其容易漏记；当前版本的数据缺少历史快照来估计补录过程。因此，本文对近期系数的解释保留这一观测边界。招聘与任职、入职与就业存量、工作年限与年龄分别刻画劳动市场的不同侧面，也构成与薪资单研究或企业采用研究对话的基础。[4]

## 附录 A：完整技能表与测量口径

下表列出15类语言及相关生态标签、6类框架标签的提及率。美国2026年为1—8月；中国列至2024年，保留合并来源描述，跨国来源内的技术栈比较见正文图3。单位为命中该标签的匹配记录数／全部匹配记录数×100。标题及描述标签均可同时命中多项，列和没有总量意义。

| 语言／框架 | 美国2021 | 美国2025 | 美国2026前八月 | 中国2021 | 中国2024 |
| --- | --- | --- | --- | --- | --- |
| Python | 13.56 | 18.09 | 19.05 | 4.51 | 3.37 |
| Java | 14.72 | 13.25 | 13.70 | 4.46 | 2.86 |
| JavaScript / Node | 14.57 | 15.26 | 12.33 | 9.10 | 4.56 |
| TypeScript | 2.68 | 3.64 | 3.97 | 1.07 | 0.67 |
| SQL | 18.03 | 18.26 | 18.28 | 13.77 | 7.39 |
| C++ | 4.60 | 5.60 | 4.98 | 12.11 | 6.74 |
| C | 1.65 | 1.45 | 1.57 | 3.04 | 2.02 |
| C# / .NET | 8.29 | 7.62 | 6.73 | 2.94 | 2.36 |
| Go | 2.40 | 2.58 | 2.26 | 1.83 | 0.80 |
| Rust | 0.31 | 0.78 | 0.87 | 0.11 | 0.08 |
| Kotlin | 0.97 | 0.83 | 0.84 | 0.26 | 0.22 |
| Swift | 0.99 | 0.92 | 0.72 | 0.23 | 0.13 |
| PHP | 1.87 | 0.91 | 0.69 | 1.06 | 0.48 |
| Ruby | 3.12 | 1.34 | 1.08 | 0.31 | 0.15 |
| Scala | 1.55 | 1.26 | 0.94 | 0.43 | 0.19 |
| React | 7.62 | 5.78 | 5.79 | 3.08 | 1.20 |
| Vue | 1.54 | 1.04 | 0.98 | 3.20 | 1.41 |
| Angular | 5.57 | 3.70 | 3.80 | 1.47 | 0.47 |
| Electron | 0.09 | 0.07 | 0.13 | 0.09 | 0.05 |
| Qt | 0.12 | 0.10 | 0.10 | 0.22 | 0.19 |
| WPF / WinForms / MFC | 0.30 | 0.20 | 0.26 | 0.20 | 0.16 |


文本样本按帖子ID系统抽取，美国约1/50，中国约1/20，再与标题、描述匹配。每项描述标签在清洗后的文本中作二元关键词匹配，重复出现同一关键词仍计一次；未观察到相应文本命中的匹配记录保留在分母中。匹配采用中英文关键词；Go、C和Swift另约束语言语境。小样本人工阅读用于修正规则，整体误差率尚待代表性验证。

美国全栈标题占比（2021至2026年前八月）依次为3.21%、3.19%、2.64%、3.86%、2.44%、2.74%；后端为1.48%、1.57%、1.03%、2.41%、1.27%、1.07%；数据工程为2.45%、2.50%、2.29%、2.64%、2.25%、2.48%；DevOps／云／运维为7.20%、7.51%、5.91%、6.34%、5.87%、6.34%；桌面端为0.05%、0.05%、0.05%、0.05%、0.04%、0.06%。标题方向的变化也有明显异质性。

按来源的低经验要求比较，分母为识别到年限的帖子。LinkedIn-only的年限识别率从55.6%变为47.0%，other从35.8%变为51.5%。中文招聘板标题中的初级关键词占比，2022H2为3.2%，2025H1为3.1%；这是覆盖较窄的标题表达指标。

## 附录 B：样本与回归比较

招聘—任职模型涵盖美国61,054家企业、744职业、346,699个企业×职业组合。样本要求2021H1—2022H2至少20条招聘帖和5条任职记录；事件窗口至2025H2，合并比较截止2025H1。对招聘、任职及二者对数差分别估计：

$$y_{fot}=\beta E_oPost_t+\alpha_{fo}+\lambda_{ft}+\varepsilon_{fot}.$$

企业×职业固定效应控制各组合长期差异，企业×半年固定效应控制企业当期的共同变化。职业暴露每增加一个标准差，系数表示加一对数计数的条件差异。二者的对数差为$\log(1+H)-\log(1+P)$，是同一设计下的代数比较。资历1–2级该差值为+0.073（0.011），3–4级为+0.082（0.011）；组间差值直接估计为−0.008（0.010）。

中美职业暴露的时间比较控制职业×来源与来源×半年固定效应，以2022H2为参照，标准误按职业聚类。它与下述企业内经历组比较使用不同估计对象。

下表给出正文所比较的两类来源在2021H1—2025H1的完整系数。单位为每一标准差职业 AI 暴露对应的加一对数招聘计数差异，括号内为职业聚类标准误。中国招聘板模型包含723个职业，美国 LinkedIn-only 模型包含781个职业；2022H2为归零参照期。

| 半年 | 中国招聘板 | 美国 LinkedIn-only |
| --- | ---: | ---: |
| 2021H1 | +0.152（0.017） | +0.004（0.016） |
| 2021H2 | +0.127（0.013） | +0.027（0.012） |
| 2022H1 | +0.089（0.010） | +0.008（0.009） |
| 2022H2 | 参照期 | 参照期 |
| 2023H1 | −0.043（0.008） | −0.044（0.011） |
| 2023H2 | −0.092（0.011） | −0.092（0.014） |
| 2024H1 | −0.117（0.011） | −0.083（0.018） |
| 2024H2 | −0.093（0.012） | −0.057（0.023） |
| 2025H1 | −0.019（0.016） | −0.022（0.025） |


职业早期分析按用户ID取五分之一，使用美国选定企业内的外部任职。企业名单按2021年1月至2022年10月的招聘记录选取；企业×职业组合须在2019H1—2022H2至少有10条抽样外部任职。估计前选出102,115个组合，构造半年×经历组面板。合并时期为2019H1—2025H1，后期为2023H1—2025H1：

$$\log(1+n_{fogt})=\delta E_oJ_gPost_t+\mu_{fog}+\lambda_{ftg}+\pi_{fot}+\varepsilon_{fogt}.$$

三个固定效应依次控制企业×职业×组别的长期差异、企业当期对组别的共同变化，以及企业职业当期对两组的共同变化。标准误按职业聚类。零单元表示抽样来源中未观察到记录。

任职经历以按任职次序累计的最早已记录开始日计算，不足1,096天为早期组；教育口径采用不晚于任职开始后182天的最近教育结束日期，排除教育日期缺失。外部任职包含第一段已记录任职及上一段已知母公司不同的任职。首次任职可包括实习；分组随每次任职开始时的经历变化。

| 分组 | 事件面板记录数（至2025H2） | 合并系数（标准误） | 前期联合检验p |
| --- | ---: | ---: | ---: |
| 任职经历不足三年／至少三年 | 6,608,490 | +0.028（0.007） | 0.001 |
| 教育结束不足三年／至少三年 | 4,640,947 | +0.026（0.007） | 0.149 |
| 首次／其他外部任职 | 6,608,490 | +0.043（0.009） | <0.001 |
| 资历1–2级／3–4级 | 6,092,803 | −0.018（0.008） | <0.001 |

这些记录总数涵盖完整事件窗口；最终有效回归单元数、企业数和聚类数尚缺明确汇总。不同操作性定义对应不同记录与比较样本，估计差异的来源仍需共同样本分解。任职不足三年记录中49.5%缺教育日期；任职至少六年记录中22.2%归入教育结束不足三年。

## 附录 C：替代比较与趋势敏感性

下表将回答不同问题的设计并列。它们涉及的记录、权重、比较组和控制项各有不同。

| 比较 | 主要结果（标准误） | 对应问题 |
| --- | --- | --- |
| 职业层面、初级标签招聘，2023后 | −0.070（0.017） | 高暴露职业的初级相对招聘变化 |
| 同设计加入差异化线性趋势 | +0.152（0.024） | 相同问题对趋势设定的敏感程度 |
| 同设计采用同比变化 | −0.027（0.021） | 季度同比的比较 |
| 将分界设在2022Q1 | −0.087（0.018） | 2023前已存在的变化 |
| 公司×资历×季度控制的招聘模型 | −0.046（0.033） | 企业组别共同变化后的职业差异 |
| 生成式AI岗位识别企业、加权任职三重差分 | −0.120（0.011） | 采用企业代理组与其他企业的初级相对变化 |
| 职业层面、资历标签的加权任职 | −0.073（0.009） | 职业层面的初级相对任职变化 |

采用企业代理组由首次出现 Generative AI Engineer／Conversational AI Engineer 类岗位识别，共1,066家；加权任职比较涵盖2019Q1—2025Q4，含内部变动。它观察的企业间差异，与正文按经历划分的企业内外部任职比较互为不同视角。

按任职经历划分的外部任职模型，换用Felten语言模型暴露为+0.048（0.008），较早AI暴露为+0.049（0.007），Eloundou人工评分为+0.026（0.008）；排除计算机职业为+0.029（0.011），截止2024H2为+0.021（0.006）。多个规格呈现正向点估计，同时多数规格的前期联合检验拒绝零差异。

趋势敏感性使用Rambachan与Roth的方法[5]。直观地说，它允许高低暴露职业之间原本就存在的相对变化，在2023年以后继续出现，再据此扩大估计区间。RM约束将后期这种趋势偏离的每期变化，限制在前期最大每期变化的指定倍数内。它处理的是趋势假设，对平台覆盖与履历补录的约束另需数据。

| 2023H1—2025H1五个事件系数的等权平均 | 任职年限口径95%区间 | 教育时间口径95%区间 |
| --- | --- | --- |
| 常规区间 | [0.023,0.047] | [0.017,0.036] |
| RM=0.5 | [−0.019,0.095] | [−0.012,0.065] |
| RM=1 | [−0.070,0.147] | [−0.047,0.100] |
| RM=2 | [−0.171,0.241] | [−0.108,0.161] |

敏感性输入包括2019H1—2022H1七个前期系数、2023H1—2025H2六个后期系数及完整协方差；2022H2归零，平均目标给予前五个后期各1/5权重，最后一期权重为零。该平均目标与合并回归系数有所区别。RM使用C-LF置信集；平滑性约束采用FLCI，两者置信水平为95%。

## 参考文献与数据来源

[1] Revelio Labs. [Methodologies](https://www.data-dictionary.reveliolabs.com/methodology.html)；[Datasets](https://www.data-dictionary.reveliolabs.com/data.html)。本文图表基于Revelio招聘与职业履历样本。

[2] Eloundou, T., Manning, S., Mishkin, P., & Rock, D. (2023). *GPTs are GPTs: An early look at the labor market impact potential of large language models*. [arXiv:2303.10130](https://doi.org/10.48550/arXiv.2303.10130)。相关发表版：(2024), *Science*, 384, 1306–1308. [DOI](https://doi.org/10.1126/science.adj0998)。替代指标：Felten, E., Raj, M., & Seamans, R. (2021), *Strategic Management Journal*, 42, 2195–2217. [DOI](https://doi.org/10.1002/smj.3286)；同作者(2023), *How will language modelers like ChatGPT affect occupations and industries?* [预印本](https://doi.org/10.48550/arXiv.2303.01157)。

[3] GitHub. [Copilot 全面开放，2022-06-21](https://github.blog/news-insights/product-news/github-copilot-is-generally-available-to-all-developers/)；OpenAI. [ChatGPT，2022-11-30](https://openai.com/index/chatgpt/)；Anthropic. [Claude 4与Claude Code全面开放，2025-05-22](https://www.anthropic.com/research/claude-4)。

[4] Brynjolfsson, E., Chandar, B., & Chen, R. (2025). *Canaries in the coal mine? Six facts about the recent employment effects of artificial intelligence*. [工作论文](https://siepr.stanford.edu/publications/working-paper/canaries-coal-mine-six-facts-about-recent-employment-effects-artificial)。Hosseini Maasoum, S. M., & Lichtinger, G. (2025). *Generative AI as seniority-biased technological change: Evidence from U.S. résumé and job posting data*. [工作论文](https://doi.org/10.2139/ssrn.5425555)。

[5] Rambachan, A., & Roth, J. (2023). A more credible approach to parallel trends. *Review of Economic Studies*, 90, 2555–2591. [DOI](https://doi.org/10.1093/restud/rdad018)。
