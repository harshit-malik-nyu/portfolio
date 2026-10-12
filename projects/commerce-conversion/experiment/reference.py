"""Regenerate independent numeric fixtures. Requires scipy; not a CI runtime dependency."""
from pathlib import Path
import json, scipy
from scipy.stats import binomtest, chi2
cases=[]
for k,n in [(0,100),(100,100),(11000,40000),(12400,40000),(400,40000),(1,1000),(500,1000)]:
 c=binomtest(k,n).proportion_ci(confidence_level=.9875,method='wilson')
 cases.append({'successes':k,'n':n,'interval':[float(c.low),float(c.high)]})
srm=[{'control':c,'treatment':t,'p':float(chi2.sf((c-t)**2/(c+t),1))} for c,t in [(40000,40000),(40000,38000),(40000,39000),(100,80),(1000,980)]]
Path(__file__).with_name('numeric-reference.json').write_text(json.dumps({'generator':'scipy.stats.binomtest.proportion_ci and scipy.stats.chi2.sf','scipy_version':scipy.__version__,'confidence_level':.9875,'wilson':cases,'srm':srm},indent=2)+'\n')
