"""Reproduce charts from arXiv:2610.12176v1, Appendix C.5, Table 7.
Values: trial mean and sample SD. Not confidence intervals.
Run with Python and matplotlib; SVGs are the public figures.
"""
from pathlib import Path
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib.ticker import MaxNLocator

DATA = [
 ('science', [28.8,31.7], [1.5,2.0], 'Success (%)', 40, 1),
 ('mlr', [1.58,2.40], [.38,.28], 'Overall score (0–10)', 3, 2),
 ('asta', [.053,.067], [.002,.017], 'Rubric fraction (0–1)', .1, 3),
 ('ds', [.473,.482], [.029,.025], 'Normalized score', .6, 3),
 ('terminal', [37.5,35.2], [2.2,1.7], 'Pass (%)', 50, 1),
 ('swe', [62.6,61.1], [1.4,.6], 'Pass (%)', 80, 1),
]
plt.rcParams.update({'font.family':'DejaVu Sans','font.size':13,'svg.hashsalt':'mass-results-v1'})
for name, means, sd, xlabel, xmax, precision in DATA:
 fig,ax=plt.subplots(figsize=(5.6,2.55))
 fig.subplots_adjust(left=.19,right=.90,top=.73,bottom=.3)
 for i,(m,s) in enumerate(zip(means,sd)):
  y=1-i
  ax.barh(y,m,height=.36,color=['#92978b','#526848'][i],zorder=2)
  ax.errorbar(m,y,xerr=s,color='#20261d',capsize=4,lw=1.3,zorder=3)
  ax.text(.01,1.21-i*.26,f'{["Base", "MASS"][i]}: {m:.{precision}f} ± {s:.{precision}f}',transform=ax.transAxes,fontsize=16)
 ax.set_yticks([1,0],['Base','MASS']);ax.set_ylim(-.45,1.45);ax.set_xlim(0,xmax)
 ax.xaxis.set_major_locator(MaxNLocator(nbins=4));ax.set_xlabel(xlabel,fontsize=16)
 ax.tick_params(axis='both',length=0,labelsize=16,pad=7)
 ax.grid(axis='x',color='#e3e5df',lw=.7,zorder=0)
 for side in ['top','right','left']:ax.spines[side].set_visible(False)
 ax.spines['bottom'].set_color('#b4b8ae')
 fig.savefig(Path(__file__).parent/(name+'.svg'),transparent=True,metadata={'Date':None,'Creator':'matplotlib; MASS v1 Table 7'})
 output = Path(__file__).parent/(name+'.svg')
 output.write_text('\n'.join(line.rstrip() for line in output.read_text().splitlines())+'\n')
 plt.close(fig)
