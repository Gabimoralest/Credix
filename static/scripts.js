const tip=document.getElementById('tip');
const ST=(e,h)=>{tip.innerHTML=h;tip.style.opacity=1;tip.style.left=(e.clientX+14)+'px';tip.style.top=(e.clientY-30)+'px';};
const HT=()=>tip.style.opacity=0;
const C={green:'#16A34A',green2:'#15803D',greenB:'#DCFCE7',red:'#DC2626',red2:'#B91C1C',redB:'#FEE2E2',orange:'#D97706',orange2:'#B45309',orangeB:'#FEF3C7',blue:'#2563EB',blue2:'#1D4ED8',blueB:'#DBEAFE',purple:'#7C3AED',gold:'#D97706',muted:'#94A3B8',light:'#CBD5E1',border:'#E2E8F0',bg:'#F8FAFC',cl0:'#2563EB',cl1:'#D97706'};
const PAL=[C.green,C.blue,C.orange,C.purple,C.red,C.gold];
function W(id){return document.getElementById(id)?.offsetWidth||500;}
let D=null;

fetch('/static/datos.json')
  .then(r=>{if(!r.ok)throw new Error(r.status);return r.json();})
  .then(data=>{D=data;init();})
  .catch(()=>{document.getElementById('loading').innerHTML=`<div style="text-align:center;padding:2rem;max-width:480px"><div style="font-size:2.5rem;margin-bottom:1rem">⚠️</div><p style="font-weight:800;color:#E05252;margin-bottom:.5rem;font-size:1.1rem">No se encontró datos.json</p><p style="color:#7880A0;font-size:12px;line-height:1.8">Pon <code style="background:#EEF0F7;padding:2px 6px;border-radius:4px">datos.json</code> en la misma carpeta y ábrelo con:<br><br><code style="background:#EEF0F7;padding:4px 8px;border-radius:4px">python -m http.server 8080</code></p></div>`;});

function init(){
  document.getElementById('loading').style.display='none';
  document.getElementById('app-layout').style.display='flex';
  const xgb=D.modelos.find(m=>m.nombre==='XGBoost')||D.modelos[2];
  const pct=(D.dataset.aprobados/D.dataset.total*100).toFixed(1);
  const pctRec=(D.dataset.rechazados/D.dataset.total*100).toFixed(1);

  // Header KPIs
  document.getElementById('kpi-apr').textContent=`${D.dataset.aprobados.toLocaleString('es-CO')} (${pct}%)`;
  document.getElementById('kpi-auc').textContent=xgb.auc;
  document.getElementById('kpi-k').textContent=`K = ${D.kmeans_eval.k_optimo}`;

  // KPI cards overview
  document.getElementById('kpi-apr2').textContent=`${D.dataset.aprobados.toLocaleString('es-CO')}`;
  const kpiTotal=document.getElementById('kpi-total');
  if(kpiTotal) kpiTotal.textContent=D.dataset.total.toLocaleString('es-CO');
  const kpiRec=document.getElementById('kpi-rec');
  if(kpiRec) kpiRec.textContent=D.dataset.rechazados.toLocaleString('es-CO');
  const kpiRecPct=document.getElementById('kpi-rec-pct');
  if(kpiRecPct) kpiRecPct.textContent=`${pctRec}% del total`;
  const kpiAprPct=document.getElementById('kpi-apr-pct');
  if(kpiAprPct) kpiAprPct.textContent=`${pct}% del total`;

  // Hero stats
  const heroTotal=document.getElementById('hero-total');
  if(heroTotal) heroTotal.textContent=D.dataset.total.toLocaleString('es-CO');
  const heroAuc=document.getElementById('hero-auc');
  if(heroAuc) heroAuc.textContent=xgb.auc;
  const heroK=document.getElementById('hero-k');
  if(heroK) heroK.textContent=`K=${D.kmeans_eval.k_optimo}`;

  // AUC en texto del predictor
  const predAucTxt=document.getElementById('pred-auc-txt');
  if(predAucTxt) predAucTxt.textContent=xgb.auc;
  buildG01();buildG02();buildG01dona();

  // Navegacion sidebar
  document.querySelectorAll('.sidebar-item').forEach(item=>{
    item.addEventListener('click',()=>{
      const tab = item.dataset.tab;
      // actualizar sidebar activo
      document.querySelectorAll('.sidebar-item').forEach(x=>x.classList.remove('active'));
      item.classList.add('active');
      // actualizar iconos del sidebar
      item.querySelectorAll('svg').forEach(svg=>svg.style.color='var(--blue)');
      document.querySelectorAll('.sidebar-item:not(.active) svg').forEach(svg=>svg.style.color='var(--muted)');
      // mostrar seccion
      document.querySelectorAll('.section').forEach(x=>x.classList.remove('active'));
      document.getElementById('tab-'+tab).classList.add('active');
      // mantener tabs sincronizados (para que los botones del hero funcionen)
      document.querySelectorAll('.tab').forEach(x=>x.classList.remove('active'));
      const matchTab = document.querySelector(`.tab[data-tab="${tab}"]`);
      if(matchTab) matchTab.classList.add('active');
      renderTab(tab);
    });
  });

  // Tabs ocultos siguen funcionando para los botones del hero
  document.querySelectorAll('.tab').forEach(t=>{
    t.addEventListener('click',()=>{
      const tab = t.dataset.tab;
      document.querySelectorAll('.tab').forEach(x=>x.classList.remove('active'));
      document.querySelectorAll('.section').forEach(x=>x.classList.remove('active'));
      t.classList.add('active');
      document.getElementById('tab-'+tab).classList.add('active');
      // sincronizar sidebar
      document.querySelectorAll('.sidebar-item').forEach(x=>x.classList.remove('active'));
      const matchSidebar = document.querySelector(`.sidebar-item[data-tab="${tab}"]`);
      if(matchSidebar) matchSidebar.classList.add('active');
      renderTab(tab);
    });
  });

  // ── Sidebar toggle ──
  const sidebarEl   = document.getElementById('sidebar');
  const mainWrapEl  = document.getElementById('main-wrap');
  const toggleBtn   = document.getElementById('sidebar-toggle');

  toggleBtn.addEventListener('click', () => {
    const isCollapsed = sidebarEl.classList.toggle('collapsed');
    mainWrapEl.classList.toggle('sidebar-collapsed', isCollapsed);
    toggleBtn.classList.toggle('collapsed', isCollapsed);
    setTimeout(() => {
      const activeTab = document.querySelector('.sidebar-item.active');
      if(activeTab){
        const tab = activeTab.dataset.tab;
        // Limpiar TODOS los contenedores de la pestaña activa
        const allIds = {
          ov: ['g01','g01dona','g02'],
          o1: ['g03','g04','g05','g06','g07'],
          o2: ['g08','g09','g10','gpca','gradar','gviolin_cluster'],
          o3: ['g11','g12','g13','g3cm','gpr','g14a','g14b','g15']
        };
        (allIds[tab]||[]).forEach(id=>{
          const el=document.getElementById(id);
          if(el) el.innerHTML='';
        });
        // Permitir que se re-renderice
        done.delete(tab);
        // Redibujar
        if(tab==='ov'){ buildG01(); buildG02(); buildG01dona(); }
        else { renderTab(tab); }
      }
    }, 320);
  });
}

const done=new Set(['ov']);
function renderTab(n){
  if(done.has(n))return;done.add(n);
  if(n==='o1'){buildG03();buildG04();buildG05();buildG06();buildG07();}
  if(n==='o2'){buildG08();buildG09();buildG10();buildPCA();buildRadar();buildViolinCluster();}
  // FIX 1: buildG14a() incluido
  if(n==='o3'){buildG11();buildG12();buildG13();build3CM();buildPR();buildG14a();buildG14b();buildG15();}
}

function buildG01(){
  document.getElementById('g01').innerHTML='';
  const ds=D.dataset,pct=(ds.aprobados/ds.total*100).toFixed(1);
  document.getElementById('i01').textContent=`De cada 100 solicitudes, solo ${pct} fueron aprobadas. El desbalance ${(100-pct).toFixed(1)}/${pct} justifica el uso de SMOTE.`;
  const data=[{label:'Aprobados (loan_status = 1)',v:ds.aprobados,c:C.green},{label:'Rechazados (loan_status = 0)',v:ds.rechazados,c:C.red}];
  const Ww=W('g01'),H=130,m={t:10,r:10,b:10,l:220},iw=Ww-m.l-m.r,ih=H-m.t-m.b;
  const svg=d3.select('#g01').append('svg').attr('width',Ww).attr('height',H);
  const g=svg.append('g').attr('transform',`translate(${m.l},${m.t})`);
  const x=d3.scaleLinear().domain([0,ds.total]).range([0,iw]),y=d3.scaleBand().domain(data.map(d=>d.label)).range([0,ih]).padding(.35);
  g.selectAll('.b').data(data).join('rect').attr('x',0).attr('y',d=>y(d.label)).attr('width',0).attr('height',y.bandwidth()).attr('fill',d=>d.c).attr('rx',6).on('mouseover',(e,d)=>ST(e,`${d.label}: ${d.v.toLocaleString('es-CO')}`)).on('mouseout',HT).transition().duration(700).ease(d3.easeCubicOut).attr('width',d=>x(d.v));
  g.selectAll('.v').data(data).join('text').attr('x',d=>x(d.v)+8).attr('y',d=>y(d.label)+y.bandwidth()/2).attr('dominant-baseline','middle').attr('font-size',12).attr('font-weight','700').attr('font-family',"'Inter',sans-serif").attr('fill',d=>d.c).attr('opacity',0).text(d=>`${d.v.toLocaleString('es-CO')} · ${(d.v/ds.total*100).toFixed(1)}%`).transition().delay(600).duration(200).attr('opacity',1);
  g.append('g').call(d3.axisLeft(y).tickSize(0)).call(gy=>{gy.select('.domain').remove();gy.selectAll('text').attr('font-size',11).attr('fill',C.muted).attr('font-weight','600').attr('dx','-8');});
}

function buildG01dona(){
  document.getElementById('g01dona').innerHTML='';
  const ds=D.dataset,Ww=Math.min(W('g01dona'),180),H=130;
  const data=[{label:'Aprobados',v:ds.aprobados,c:C.green},{label:'Rechazados',v:ds.rechazados,c:C.red}];
  const svg=d3.select('#g01dona').append('svg').attr('width',Ww).attr('height',H);
  const g=svg.append('g').attr('transform',`translate(${Ww/2},${H/2})`);
  const pie=d3.pie().value(d=>d.v).sort(null),arc=d3.arc().innerRadius(38).outerRadius(58);
  g.selectAll('path').data(pie(data)).join('path').attr('fill',d=>d.data.c).attr('stroke','white').attr('stroke-width',2).attr('d',arc).on('mouseover',(e,d)=>ST(e,`${d.data.label}: ${(d.data.v/ds.total*100).toFixed(1)}%`)).on('mouseout',HT);
  g.append('text').attr('text-anchor','middle').attr('dominant-baseline','middle').attr('font-size',13).attr('font-weight','800').attr('font-family',"'Inter',sans-serif").attr('fill','#111827').text((ds.aprobados/ds.total*100).toFixed(1)+'%');
  g.append('text').attr('y',16).attr('text-anchor','middle').attr('font-size',9).attr('fill',C.muted).text('aprobados');
}

function buildG02(){
  document.getElementById('g02').innerHTML='';
  const ds=D.dataset,pD=(ds.con_default/ds.total*100).toFixed(1);
  const pDef=(ds.con_default/ds.total*100).toFixed(1);
  document.getElementById('i02').textContent=`El ${pDef}% de las solicitudes tienen incumplimientos previos. Todas pasan al modelo XGBoost, que evalúa su perfil completo para decidir.`;
  const nodes=[{id:'tot',label:`${ds.total.toLocaleString('es-CO')} solicitudes totales`,v:ds.total,c:C.blue},{id:'def',label:`${ds.con_default.toLocaleString('es-CO')} — con incumplimiento previo`,v:ds.con_default,c:C.orange},{id:'mod',label:`${ds.total.toLocaleString('es-CO')} — evaluadas por XGBoost`,v:ds.total,c:C.blue},{id:'apr',label:`${ds.aprobados.toLocaleString('es-CO')} — aprobados`,v:ds.aprobados,c:C.green},{id:'rec',label:`${ds.rechazados.toLocaleString('es-CO')} — rechazados`,v:ds.rechazados,c:C.red}];
  const Ww=W('g02'),H=210,m={t:10,r:10,b:10,l:10},iw=Ww-m.l-m.r,ih=H-m.t-m.b;
  const svg=d3.select('#g02').append('svg').attr('width',Ww).attr('height',H);
  const g=svg.append('g').attr('transform',`translate(${m.l},${m.t})`);
  const maxV=ds.total,cW=iw*0.28,cX=[0,iw*0.36,iw*0.72],bh=d=>Math.max(22,(d.v/maxV)*(ih-40));
  const cols=[[nodes[0]],[nodes[1],nodes[2]],[nodes[3],nodes[4]]],pos={};
  cols.forEach((col,ci)=>{const tot=col.reduce((s,d)=>s+bh(d),0)+(col.length-1)*10;let yy=(ih-tot)/2;col.forEach(d=>{const h=bh(d);pos[d.id]={x:cX[ci],y:yy,h,w:cW};yy+=h+10;});});
  [['tot','def'],['tot','mod'],['mod','apr'],['mod','rec']].forEach(([f,t])=>{const s=pos[f],tt=pos[t],x1=s.x+s.w,y1=s.y+s.h/2,x2=tt.x,y2=tt.y+tt.h/2;g.append('path').attr('d',`M${x1},${y1} C${(x1+x2)/2},${y1} ${(x1+x2)/2},${y2} ${x2},${y2}`).attr('fill','none').attr('stroke',C.border).attr('stroke-width',2);});
  nodes.forEach(d=>{const p=pos[d.id];g.append('rect').attr('x',p.x).attr('y',p.y).attr('width',0).attr('height',p.h).attr('fill',d.c).attr('rx',8).attr('opacity',.9).on('mouseover',e=>ST(e,`${d.label} · ${(d.v/ds.total*100).toFixed(1)}%`)).on('mouseout',HT).transition().duration(600).ease(d3.easeCubicOut).attr('width',p.w);g.append('text').attr('x',p.x+p.w+8).attr('y',p.y+p.h/2-6).attr('font-size',10).attr('font-weight','700').attr('fill',d.c).text((d.v/ds.total*100).toFixed(1)+'%');g.append('text').attr('x',p.x+p.w+8).attr('y',p.y+p.h/2+8).attr('font-size',9).attr('fill',C.muted).text(d.label);});
}

function violin(sel,dataA,dataR,domain,fmtFn,insId,insTextFn){
  const Ww=W(sel),H=220,m={t:28,r:20,b:38,l:55},iw=Ww-m.l-m.r,ih=H-m.t-m.b;
  const svg=d3.select('#'+sel).append('svg').attr('width',Ww).attr('height',H);
  const g=svg.append('g').attr('transform',`translate(${m.l},${m.t})`);
  const y=d3.scaleLinear().domain(domain).range([ih,0]);
  g.append('g').call(d3.axisLeft(y).ticks(5).tickFormat(fmtFn)).call(gy=>{gy.select('.domain').attr('stroke',C.border);gy.selectAll('text').attr('font-size',10).attr('fill',C.muted);gy.selectAll('line').attr('stroke',C.border).attr('stroke-dasharray','3 2');});
  function bs(arr){const s=[...arr].sort((a,b)=>a-b);const q1=d3.quantile(s,.25),q3=d3.quantile(s,.75),iqr=q3-q1;return{min:Math.max(d3.min(s),q1-1.5*iqr),q1,med:d3.median(s),q3,max:Math.min(d3.max(s),q3+1.5*iqr)};}
  function kde(k,thr,data){return thr.map(x=>[x,d3.mean(data,v=>k(x-v))]);}
  function ep(bw){return x=>Math.abs(x/=bw)<1?0.75*(1-x*x)/bw:0;}
  const thr=d3.range(domain[0],domain[1],(domain[1]-domain[0])/60);
  [{data:dataR,c:C.red,label:'Rechazados (0)',cx:iw*.27},{data:dataA,c:C.green,label:'Aprobados (1)',cx:iw*.73}].forEach(({data,c,label,cx})=>{
    const den=kde(ep((domain[1]-domain[0])/7),thr,data),mxD=d3.max(den,d=>d[1]),xs=d3.scaleLinear().domain([0,mxD]).range([0,iw*.2]);
    const area=d3.area().x0(d=>cx-xs(d[1])).x1(d=>cx+xs(d[1])).y(d=>y(d[0])).curve(d3.curveCatmullRom);
    g.append('path').datum(den).attr('d',area).attr('fill',c).attr('opacity',.18);
    g.append('path').datum(den).attr('d',d3.line().x(d=>cx+xs(d[1])).y(d=>y(d[0])).curve(d3.curveCatmullRom)).attr('fill','none').attr('stroke',c).attr('stroke-width',2).attr('opacity',.7);
    g.append('path').datum(den).attr('d',d3.line().x(d=>cx-xs(d[1])).y(d=>y(d[0])).curve(d3.curveCatmullRom)).attr('fill','none').attr('stroke',c).attr('stroke-width',2).attr('opacity',.7);
    const s=bs(data),bw=iw*.07;
    g.append('line').attr('x1',cx).attr('x2',cx).attr('y1',y(s.min)).attr('y2',y(s.max)).attr('stroke',c).attr('stroke-width',1.5);
    g.append('rect').attr('x',cx-bw).attr('y',y(s.q3)).attr('width',bw*2).attr('height',y(s.q1)-y(s.q3)).attr('fill','white').attr('stroke',c).attr('stroke-width',2).attr('rx',3);
    g.append('line').attr('x1',cx-bw).attr('x2',cx+bw).attr('y1',y(s.med)).attr('y2',y(s.med)).attr('stroke',c).attr('stroke-width',3);
    g.append('text').attr('x',cx).attr('y',y(s.med)-9).attr('text-anchor','middle').attr('font-size',11).attr('font-family',"'Inter',sans-serif").attr('font-weight','600').attr('fill','#111827').text(fmtFn(s.med));
    g.append('text').attr('x',cx).attr('y',ih+22).attr('text-anchor','middle').attr('font-size',11).attr('fill',C.muted).attr('font-weight','600').text(label);
    g.append('text').attr('x',cx).attr('y',-10).attr('text-anchor','middle').attr('font-size',10).attr('font-family',"'Inter',sans-serif").attr('fill','#111827').text(`n = ${data.length.toLocaleString('es-CO')}`);

    if(insId&&insTextFn)document.getElementById(insId).textContent=insTextFn(bs(dataA),bs(dataR));
  });
}

function buildG03(){
  document.getElementById('g03').innerHTML='';const d=D.distribuciones.loan_percent_income;violin('g03',d.aprobados,d.rechazados,[0,100],v=>v+'%','i03',(a,r)=>`Mediana aprobados: ${a.med.toFixed(1)}% vs rechazados: ${r.med.toFixed(1)}%. Diferencia de +${(a.med-r.med).toFixed(1)} pp — la mayor brecha entre todas las variables numéricas.`);}
function buildG04(){
  document.getElementById('g04').innerHTML='';const d=D.distribuciones.loan_int_rate;violin('g04',d.aprobados,d.rechazados,[300,2100],v=>d3.format(',')(Math.round(v)),'i04',(a,r)=>`Paradoja: aprobados tienen tasa más alta (${Math.round(a.med).toLocaleString('es-CO')} vs ${Math.round(r.med).toLocaleString('es-CO')}). La tasa la asigna el banco según el riesgo percibido, no al revés.`);}

function buildG05(){
  document.getElementById('g05').innerHTML='';
  const data=D.proposito,top=data[0],bot=data[data.length-1];
  document.getElementById('i05').textContent=`${top.label}: ${top.pct}% aprobación. ${bot.label}: ${bot.pct}%. Diferencia de ${(top.pct-bot.pct).toFixed(1)} pp entre extremos.`;
  const avg=D.dataset.aprobados/D.dataset.total*100,Ww=W('g05'),H=210,m={t:10,r:70,b:30,l:130},iw=Ww-m.l-m.r,ih=H-m.t-m.b;
  const svg=d3.select('#g05').append('svg').attr('width',Ww).attr('height',H);
  const g=svg.append('g').attr('transform',`translate(${m.l},${m.t})`);
  const x=d3.scaleLinear().domain([0,d3.max(data,d=>d.pct)*1.15]).range([0,iw]),y=d3.scaleBand().domain(data.map(d=>d.label)).range([0,ih]).padding(.3);
  g.selectAll('.b').data(data).join('rect').attr('x',0).attr('y',d=>y(d.label)).attr('width',0).attr('height',y.bandwidth()).attr('fill',(d,i)=>PAL[i%PAL.length]).attr('rx',6).on('mouseover',(e,d)=>ST(e,`${d.label}: ${d.pct}% · ${d.aprobados.toLocaleString('es-CO')} / ${d.total.toLocaleString('es-CO')}`)).on('mouseout',HT).transition().duration(600).ease(d3.easeCubicOut).attr('width',d=>x(d.pct));
  g.selectAll('.v').data(data).join('text').attr('x',d=>x(d.pct)+6).attr('y',d=>y(d.label)+y.bandwidth()/2).attr('dominant-baseline','middle').attr('font-size',12).attr('font-weight','700').attr('font-family',"'Inter',sans-serif").attr('fill','#111827').attr('opacity',0).text(d=>d.pct+'%').transition().delay(550).duration(200).attr('opacity',1);
  g.append('g').call(d3.axisLeft(y).tickSize(0)).call(gy=>{gy.select('.domain').remove();gy.selectAll('text').attr('font-size',11).attr('fill',C.muted).attr('font-weight','600').attr('dx','-6');});
  g.append('g').attr('transform',`translate(0,${ih})`).call(d3.axisBottom(x).ticks(5).tickFormat(d=>d+'%')).call(gx=>{gx.select('.domain').attr('stroke',C.border);gx.selectAll('text').attr('font-size',10).attr('fill',C.muted);gx.selectAll('line').attr('stroke',C.border);});
  g.append('line').attr('x1',x(avg)).attr('x2',x(avg)).attr('y1',0).attr('y2',ih).attr('stroke',C.orange).attr('stroke-width',2).attr('stroke-dasharray','5 3');
  g.append('text').attr('x',x(avg)+4).attr('y',8).attr('font-size',9).attr('fill',C.orange2).attr('font-weight','700').text(`Prom. ${avg.toFixed(1)}%`);
}

function buildG06(){
  const data=D.no_predicen,el=document.getElementById('g06'),t=document.createElement('table');t.className='var-table';
  t.innerHTML=`<thead><tr><th>Variable</th><th>Aprobados</th><th>Rechazados</th><th>Δ Diferencia</th><th>Interpretación</th></tr></thead><tbody>${data.map(d=>`<tr><td style="font-family:'Inter',sans-serif;font-size:11px;color:${C.blue2};font-weight:600">${d.label}</td><td style="color:${C.green2};font-family:'Inter',sans-serif;font-size:12px;font-weight:600">${d.aprobados.toFixed(2)}</td><td style="color:${C.red2};font-family:'Inter',sans-serif;font-size:12px;font-weight:600">${d.rechazados.toFixed(2)}</td><td style="font-family:'Inter',sans-serif;font-size:12px;color:${C.muted};font-weight:700">${d.delta>0?'+':''}${d.delta.toFixed(2)}</td><td style="font-size:11px;color:${C.muted};font-style:italic;">${Math.abs(d.delta)<1?'Sin diferencia significativa':'Diferencia marginal'}</td></tr>`).join('')}</tbody>`;
  el.appendChild(t);
}

function buildG07(){
  document.getElementById('g07').innerHTML='';
  const data=[...D.lollipop].sort((a,b)=>b.delta-a.delta),top=data[0];
  document.getElementById('i07').textContent=`${top.label} tiene la mayor diferencia (Δ = ${top.delta>0?'+':''}${top.delta}). Variables con Δ ≈ 0 prácticamente no aportan al modelo.`;
  const Ww=W('g07'),H=200,m={t:10,r:60,b:25,l:185},iw=Ww-m.l-m.r,ih=H-m.t-m.b;
  const svg=d3.select('#g07').append('svg').attr('width',Ww).attr('height',H);
  const g=svg.append('g').attr('transform',`translate(${m.l},${m.t})`);
  const y=d3.scaleBand().domain(data.map(d=>d.label)).range([0,ih]).padding(.4),ext=d3.max(data,d=>Math.abs(d.delta))*1.2,x=d3.scaleLinear().domain([-ext,ext]).range([0,iw]);
  g.append('line').attr('x1',x(0)).attr('x2',x(0)).attr('y1',0).attr('y2',ih).attr('stroke',C.border).attr('stroke-width',2);
  data.forEach(d=>{
    const cy=y(d.label)+y.bandwidth()/2,c=d.delta>0.5?C.green:d.delta<-0.5?C.red:C.muted;
    g.append('line').attr('x1',x(0)).attr('x2',x(0)).attr('y1',cy).attr('y2',cy).attr('stroke',c).attr('stroke-width',3).attr('stroke-linecap','round').on('mouseover',e=>ST(e,`${d.label}: Δ=${d.delta>0?'+':''}${d.delta}`)).on('mouseout',HT).transition().duration(600).attr('x2',x(d.delta));
    g.append('circle').attr('cx',x(0)).attr('cy',cy).attr('r',7).attr('fill',c).attr('stroke','white').attr('stroke-width',2).on('mouseover',e=>ST(e,`${d.label}: Δ=${d.delta>0?'+':''}${d.delta}`)).on('mouseout',HT).transition().duration(600).attr('cx',x(d.delta));
    g.append('text').attr('x',x(d.delta)+(d.delta>=0?12:-12)).attr('y',cy).attr('dominant-baseline','middle').attr('text-anchor',d.delta>=0?'start':'end').attr('font-size',11).attr('font-family',"'Inter',sans-serif").attr('font-weight','700').attr('fill','#111827').attr('opacity',0).text((d.delta>0?'+':'')+d.delta).transition().delay(550).duration(200).attr('opacity',1);
    g.append('text').attr('x',-8).attr('y',cy).attr('dominant-baseline','middle').attr('text-anchor','end').attr('font-size',11).attr('fill',C.muted).attr('font-weight','600').text(d.label);
  });
  g.append('g').attr('transform',`translate(0,${ih})`).call(d3.axisBottom(x).ticks(5).tickFormat(d=>d>0?'+'+d:d)).call(gx=>{gx.select('.domain').attr('stroke',C.border);gx.selectAll('text').attr('font-size',10).attr('fill',C.muted);gx.selectAll('line').attr('stroke',C.border);});
}

function buildG08(){
  document.getElementById('g08').innerHTML='';
  const km=D.kmeans_eval;
  document.getElementById('i08').textContent=`K=${km.k_optimo} seleccionado: Silhouette ${km.silhouettes[0].toFixed(4)} — el más alto. Score bajo indica solapamiento, consistente con datos financieros continuos.`;
  const Ww=W('g08'),H=220,m={t:28,r:65,b:40,l:60},iw=Ww-m.l-m.r,ih=H-m.t-m.b;
  const svg=d3.select('#g08').append('svg').attr('width',Ww).attr('height',H);
  const g=svg.append('g').attr('transform',`translate(${m.l},${m.t})`);
  const x=d3.scalePoint().domain(km.ks.map(String)).range([0,iw]).padding(.3),y1=d3.scaleLinear().domain([d3.min(km.inercias)*.92,d3.max(km.inercias)*1.05]).range([ih,0]),y2=d3.scaleLinear().domain([d3.min(km.silhouettes)*.95,d3.max(km.silhouettes)*1.05]).range([ih,0]);
  g.append('g').call(d3.axisLeft(y1).ticks(4).tickSize(-iw).tickFormat('')).call(gy=>{gy.select('.domain').remove();gy.selectAll('line').attr('stroke',C.border).attr('stroke-dasharray','3 3');});
  const lI=d3.line().x((_,i)=>x(String(km.ks[i]))).y(d=>y1(d));
  g.append('path').datum(km.inercias).attr('d',lI).attr('fill','none').attr('stroke',C.blue).attr('stroke-width',2.5);
  km.inercias.forEach((v,i)=>{g.append('circle').attr('cx',x(String(km.ks[i]))).attr('cy',y1(v)).attr('r',5).attr('fill',C.blue).attr('stroke','white').attr('stroke-width',2).on('mouseover',e=>ST(e,`K=${km.ks[i]} · Inercia ${d3.format(',')(Math.round(v))}`)).on('mouseout',HT);});
  g.append('g').call(d3.axisLeft(y1).ticks(4).tickFormat(d=>(d/1000).toFixed(0)+'k')).call(gy=>{gy.select('.domain').attr('stroke',C.border);gy.selectAll('text').attr('font-size',10).attr('fill',C.blue);gy.selectAll('line').remove();});
  const lS=d3.line().x((_,i)=>x(String(km.ks[i]))).y(d=>y2(d));
  g.append('path').datum(km.silhouettes).attr('d',lS).attr('fill','none').attr('stroke',C.green).attr('stroke-width',2.5).attr('stroke-dasharray','6 3');
  km.silhouettes.forEach((v,i)=>{g.append('circle').attr('cx',x(String(km.ks[i]))).attr('cy',y2(v)).attr('r',5).attr('fill',km.ks[i]===km.k_optimo?C.orange:C.green).attr('stroke','white').attr('stroke-width',2).on('mouseover',e=>ST(e,`K=${km.ks[i]} · Silhouette ${v.toFixed(4)}`)).on('mouseout',HT);});
  g.append('g').attr('transform',`translate(${iw},0)`).call(d3.axisRight(y2).ticks(4).tickFormat(d=>d.toFixed(3))).call(gy=>{gy.select('.domain').attr('stroke',C.border);gy.selectAll('text').attr('font-size',10).attr('fill',C.green);gy.selectAll('line').remove();});
  g.append('line').attr('x1',x(String(km.k_optimo))).attr('x2',x(String(km.k_optimo))).attr('y1',0).attr('y2',ih).attr('stroke',C.orange).attr('stroke-width',2).attr('stroke-dasharray','5 3');
  g.append('text').attr('x',x(String(km.k_optimo))+4).attr('y',10).attr('font-size',10).attr('fill',C.orange2).attr('font-weight','700').attr('font-family',"'Inter',sans-serif").text(`K=${km.k_optimo} ★`);
  g.append('g').attr('transform',`translate(0,${ih})`).call(d3.axisBottom(x).tickSize(0)).call(gx=>{gx.select('.domain').attr('stroke',C.border);gx.selectAll('text').attr('font-size',11).attr('fill',C.muted);});
  g.append('text').attr('x',iw/2).attr('y',ih+32).attr('text-anchor','middle').attr('font-size',10).attr('fill',C.muted).text('Número de clusters (K)');
  const lg=svg.append('g').attr('transform',`translate(${m.l},12)`);
  [[C.blue,'Inercia (codo)'],[C.green,'Silhouette Score']].forEach(([c,lbl],i)=>{lg.append('line').attr('x1',i*140).attr('x2',i*140+18).attr('y1',6).attr('y2',6).attr('stroke',c).attr('stroke-width',2.5).attr('stroke-dasharray',i===1?'6 3':'none');lg.append('text').attr('x',i*140+22).attr('y',11).attr('font-size',10).attr('fill',C.muted).attr('font-weight','600').text(lbl);});
}

function buildG09(){
  document.getElementById('g09').innerHTML='';
  const clusters=D.clusters,vars=['person_age','person_income_log','person_emp_exp','loan_amnt_log','loan_int_rate','loan_percent_income','cred_hist_log','credit_score'],labels=['Edad','Ingreso log','Exp. laboral','Monto log','Tasa interés','% ingreso','Hist. crédito','Credit score'],cols=[C.cl0,C.cl1],names=clusters.map((_,i)=>`Cluster ${i} — ${i===0?'Maduros':'Jóvenes'}`);
  const raw=clusters.map(c=>vars.map(v=>c[v]||0)),mn=vars.map((_,i)=>Math.min(...raw.map(r=>r[i]))),mx=vars.map((_,i)=>Math.max(...raw.map(r=>r[i]))),norm=(v,i)=>mx[i]===mn[i]?.5:(v-mn[i])/(mx[i]-mn[i]);
  const c0=clusters[0],c1=clusters[1];
  document.getElementById('i09').textContent=`Cluster 0 (maduros): edad ${c0.person_age.toFixed(1)}, exp. ${c0.person_emp_exp.toFixed(1)} años, score ${c0.credit_score.toFixed(0)}. Cluster 1 (jóvenes): edad ${c1.person_age.toFixed(1)}, exp. ${c1.person_emp_exp.toFixed(1)} años, score ${c1.credit_score.toFixed(0)}.`;
  const Ww=W('g09'),cellH=36,m={t:10,r:20,b:52,l:160},iw=Ww-m.l-m.r,cw=iw/vars.length,H=clusters.length*cellH+m.t+m.b+10;
  const svg=d3.select('#g09').append('svg').attr('width',Ww).attr('height',H),g=svg.append('g').attr('transform',`translate(${m.l},${m.t})`);
  clusters.forEach((cl,ri)=>{g.append('text').attr('x',-8).attr('y',ri*cellH+cellH/2).attr('dominant-baseline','middle').attr('text-anchor','end').attr('font-size',12).attr('fill',cols[ri]).attr('font-weight','700').text(names[ri]);vars.forEach((v,ci)=>{const val=cl[v]||0,n=norm(val,ci),fill=d3.interpolate('#EEF0F7',cols[ri])(n);g.append('rect').attr('x',ci*cw).attr('y',ri*cellH).attr('width',cw-3).attr('height',cellH-3).attr('fill',fill).attr('rx',8).on('mouseover',e=>ST(e,`${names[ri]} · ${labels[ci]}: ${val.toFixed(2)}`)).on('mouseout',HT);g.append('text').attr('x',ci*cw+cw/2).attr('y',ri*cellH+cellH/2).attr('text-anchor','middle').attr('dominant-baseline','middle').attr('font-size',9).attr('font-family',"'Inter',sans-serif").attr('font-weight','600').attr('fill',n>.55?'white':cols[ri]).text(val.toFixed(1));});});
  labels.forEach((_,ci)=>{g.append('text').attr('x',ci*cw+cw/2).attr('y',clusters.length*cellH+18).attr('text-anchor','middle').attr('font-size',10).attr('fill',C.muted).attr('font-weight','600').text(labels[ci]);});
}

function buildG10(){
  document.getElementById('g10').innerHTML='';
  const clusters=D.clusters,avg=clusters.reduce((s,c)=>s+c.tasa_aprov,0)/clusters.length;
  document.getElementById('i10').textContent=`Clusters difieren en perfil demográfico pero NO en tasa de aprobación (${clusters.map(c=>c.tasa_aprov+'%').join(' vs ')}). El perfil demográfico no predice el resultado crediticio.`;
  const names=['Cluster 0 (Maduros)','Cluster 1 (Jóvenes)'],Ww=W('g10'),H=210,m={t:20,r:55,b:50,l:50},iw=Ww-m.l-m.r,ih=H-m.t-m.b;
  const svg=d3.select('#g10').append('svg').attr('width',Ww).attr('height',H),g=svg.append('g').attr('transform',`translate(${m.l},${m.t})`);
  const x=d3.scaleBand().domain(clusters.map((_,i)=>names[i])).range([0,iw]).padding(.4),y=d3.scaleLinear().domain([0,d3.max(clusters,c=>c.tasa_aprov)*1.35]).range([ih,0]);
  g.append('g').call(d3.axisLeft(y).ticks(5).tickFormat(d=>d+'%')).call(gy=>{gy.select('.domain').attr('stroke',C.border);gy.selectAll('text').attr('font-size',10).attr('fill',C.muted);gy.selectAll('line').attr('stroke',C.border).attr('stroke-dasharray','3 2');});
  clusters.forEach((cl,i)=>{const c=[C.cl0,C.cl1][i];g.append('rect').attr('x',x(names[i])).attr('y',ih).attr('width',x.bandwidth()).attr('height',0).attr('fill',c).attr('rx',8).attr('opacity',.9).on('mouseover',e=>ST(e,`${names[i]}: ${cl.tasa_aprov}% · n=${cl.n.toLocaleString('es-CO')}`)).on('mouseout',HT).transition().duration(600).ease(d3.easeCubicOut).attr('y',y(cl.tasa_aprov)).attr('height',ih-y(cl.tasa_aprov));g.append('text').attr('x',x(names[i])+x.bandwidth()/2).attr('y',y(cl.tasa_aprov)-8).attr('text-anchor','middle').attr('font-size',14).attr('font-weight','800').attr('font-family',"'Inter',sans-serif").attr('fill','#111827').attr('opacity',0).text(cl.tasa_aprov+'%').transition().delay(550).duration(200).attr('opacity',1);g.append('text').attr('x',x(names[i])+x.bandwidth()/2).attr('y',ih+18).attr('text-anchor','middle').attr('font-size',12).attr('fill',C.muted).attr('font-weight','700').text(names[i]);g.append('text').attr('x',x(names[i])+x.bandwidth()/2).attr('y',ih+34).attr('text-anchor','middle').attr('font-size',10).attr('fill',C.light).attr('font-family',"'Inter',sans-serif").text(`n = ${cl.n.toLocaleString('es-CO')}`);});
  g.append('line').attr('x1',0).attr('x2',iw).attr('y1',y(avg)).attr('y2',y(avg)).attr('stroke',C.orange).attr('stroke-width',2).attr('stroke-dasharray','6 3');
  g.append('text').attr('x',iw+4).attr('y',y(avg)).attr('dominant-baseline','middle').attr('font-size',10).attr('fill',C.orange2).attr('font-weight','700').text(avg.toFixed(1)+'%');
}

function buildPCA(){
  document.getElementById('gpca').innerHTML='';
  const pca=D.pca,Ww=W('gpca'),H=300,m={t:10,r:20,b:40,l:50},iw=Ww-m.l-m.r,ih=H-m.t-m.b;
  const svg=d3.select('#gpca').append('svg').attr('width',Ww).attr('height',H),g=svg.append('g').attr('transform',`translate(${m.l},${m.t})`);
  const x=d3.scaleLinear().domain(d3.extent(pca.pc1)).nice().range([0,iw]),y=d3.scaleLinear().domain(d3.extent(pca.pc2)).nice().range([ih,0]);
  g.append('g').call(d3.axisLeft(y).ticks(5).tickFormat(d=>d.toFixed(1))).call(gy=>{gy.select('.domain').attr('stroke',C.border);gy.selectAll('text').attr('font-size',10).attr('fill',C.muted);gy.selectAll('line').attr('stroke',C.border).attr('stroke-dasharray','3 2');});
  g.append('g').attr('transform',`translate(0,${ih})`).call(d3.axisBottom(x).ticks(5).tickFormat(d=>d.toFixed(1))).call(gx=>{gx.select('.domain').attr('stroke',C.border);gx.selectAll('text').attr('font-size',10).attr('fill',C.muted);gx.selectAll('line').attr('stroke',C.border);});
  const cols=[C.cl0,C.cl1];
  pca.pc1.forEach((pc1,i)=>{g.append('circle').attr('cx',x(pc1)).attr('cy',y(pca.pc2[i])).attr('r',3).attr('fill',cols[pca.cluster[i]]).attr('opacity',.55).on('mouseover',e=>ST(e,`Cluster ${pca.cluster[i]} · PC1: ${pc1.toFixed(2)} · PC2: ${pca.pc2[i].toFixed(2)}`)).on('mouseout',HT);});
  g.append('text').attr('x',iw/2).attr('y',ih+32).attr('text-anchor','middle').attr('font-size',11).attr('fill',C.muted).text('PC1');
  g.append('text').attr('transform','rotate(-90)').attr('x',-ih/2).attr('y',-35).attr('text-anchor','middle').attr('font-size',11).attr('fill',C.muted).text('PC2');
  const lg=svg.append('g').attr('transform',`translate(${m.l+iw-120},${m.t+10})`);
  [['Cluster 0 — Maduros',C.cl0],['Cluster 1 — Jóvenes',C.cl1]].forEach(([lbl,c],i)=>{lg.append('circle').attr('cx',6).attr('cy',i*18).attr('r',5).attr('fill',c);lg.append('text').attr('x',16).attr('y',i*18+4).attr('font-size',10).attr('fill',C.muted).attr('font-weight','600').text(lbl);});
}

function buildRadar(){
  document.getElementById('gradar').innerHTML='';
  const clusters=D.clusters,vars=['person_age','person_emp_exp','credit_score','cred_hist_log','loan_int_rate','loan_percent_income','person_income_log','loan_amnt_log'],labels=['Edad','Experiencia','Credit score','Hist. crédito','Tasa interés','% Ingreso','Ingreso','Monto'];
  const raw=clusters.map(c=>vars.map(v=>c[v]||0)),mn=vars.map((_,i)=>Math.min(...raw.map(r=>r[i]))),mx=vars.map((_,i)=>Math.max(...raw.map(r=>r[i]))),norm=(v,i)=>mx[i]===mn[i]?.5:(v-mn[i])/(mx[i]-mn[i]);
  const n=vars.length,Ww=W('gradar'),H=260,cx=Ww/2,cy=H/2,R=90,angles=vars.map((_,i)=>i*2*Math.PI/n-Math.PI/2),pt=(r,i)=>[cx+r*Math.cos(angles[i]),cy+r*Math.sin(angles[i])];
  const svg=d3.select('#gradar').append('svg').attr('width',Ww).attr('height',H);
  [.25,.5,.75,1].forEach(s=>{const pts=angles.map((_,i)=>pt(R*s,i));svg.append('polygon').attr('points',pts.map(p=>p.join(',')).join(' ')).attr('fill','none').attr('stroke',C.border).attr('stroke-width',1);});
  angles.forEach((a,i)=>{const[x2,y2]=pt(R,i);svg.append('line').attr('x1',cx).attr('y1',cy).attr('x2',x2).attr('y2',y2).attr('stroke',C.border).attr('stroke-width',1);const[lx,ly]=pt(R+18,i);svg.append('text').attr('x',lx).attr('y',ly).attr('text-anchor','middle').attr('dominant-baseline','middle').attr('font-size',10).attr('fill',C.muted).attr('font-weight','600').text(labels[i]);});
  [[C.cl0,'Cluster 0'],[C.cl1,'Cluster 1']].forEach(([c,lbl],ci)=>{const nv=vars.map((v,i)=>norm(clusters[ci][v]||0,i)),pts=angles.map((a,i)=>pt(R*nv[i],i));svg.append('polygon').attr('points',pts.map(p=>p.join(',')).join(' ')).attr('fill',c).attr('fill-opacity',.15).attr('stroke',c).attr('stroke-width',2);pts.forEach(([px,py])=>svg.append('circle').attr('cx',px).attr('cy',py).attr('r',4).attr('fill',c).attr('stroke','white').attr('stroke-width',1.5));});
  const lg=svg.append('g').attr('transform',`translate(${Ww/2-100},${H-14})`);
  [[C.cl0,'Cluster 0'],[C.cl1,'Cluster 1']].forEach(([c,lbl],i)=>{lg.append('circle').attr('cx',i*110+5).attr('cy',5).attr('r',5).attr('fill',c);lg.append('text').attr('x',i*110+14).attr('y',9).attr('font-size',10).attr('fill',C.muted).attr('font-weight','600').text(lbl);});
}

function buildViolinCluster(){
  document.getElementById('gviolin_cluster').innerHTML='';const d=D.distribuciones.loan_percent_income;violin('gviolin_cluster',d.aprobados.slice(0,250),d.rechazados.slice(0,250),[0,100],v=>v+'%',null,null);}

function buildG11(){
  document.getElementById('g11').innerHTML='';
  const models=D.modelos,maxAuc=d3.max(models,m=>m.auc),cols=[C.orange,C.blue,C.green],best=models.reduce((a,b)=>a.auc>b.auc?a:b);
  document.getElementById('i11').textContent=`${best.nombre} lidera con AUC ${best.auc} y Test Accuracy ${best.test_acc.toFixed(1)}%. Random Forest muestra la mayor brecha Train-Test, señal de overfitting moderado.`;
  const el=document.getElementById('g11'),t=document.createElement('table');t.className='scorecard';
  t.innerHTML=`<thead><tr><th>Modelo</th><th>AUC-ROC</th><th>Train Acc</th><th>Test Acc</th><th>F1-Rech.</th><th>F1-Aprov.</th><th></th></tr></thead><tbody>${models.map((m,i)=>{const cm=m.confusion_matrix,tn=cm[0][0],fp=cm[0][1],fn=cm[1][0],tp=cm[1][1],prR=tn/(tn+fn),reR=tn/(tn+fp),prA=tp/(tp+fp),reA=tp/(tp+fn),f1r=prR+reR>0?(2*prR*reR/(prR+reR)).toFixed(2):'—',f1a=prA+reA>0?(2*prA*reA/(prA+reA)).toFixed(2):'—';return`<tr><td class="sc-name" style="color:${cols[i]}">${m.nombre}</td><td><div class="bar-sc"><div class="bar-sc-bg"><div class="bar-sc-fill" style="width:${(m.auc/maxAuc)*100}%;background:${cols[i]}"></div></div><span class="sc-val" style="color:${cols[i]}">${m.auc}</span></div></td><td class="sc-val" style="color:${C.muted}">${m.train_acc.toFixed(1)}%</td><td class="sc-val" style="color:${cols[i]};font-size:14px">${m.test_acc.toFixed(1)}%</td><td class="sc-val" style="color:${C.muted}">${f1r}</td><td class="sc-val" style="color:${C.muted}">${f1a}</td><td>${m.nombre===best.nombre?'<span class="badge-best">MEJOR</span>':''}</td></tr>`;}).join('')}</tbody>`;
  el.appendChild(t);
}

function buildG12(){
  document.getElementById('g12').innerHTML='';
  const models=D.modelos,cols=[C.orange,C.blue,C.green],dashes=['3 3','7 3',null],best=models.reduce((a,b)=>a.auc>b.auc?a:b);
  document.getElementById('i12').textContent=`Los 3 modelos superan ampliamente el azar. ${best.nombre} (AUC ${best.auc}) se aleja más de la diagonal y tiene mayor área bajo la curva.`;
  const Ww=W('g12'),H=270,m={t:20,r:20,b:48,l:48},iw=Ww-m.l-m.r,ih=H-m.t-m.b;
  const svg=d3.select('#g12').append('svg').attr('width',Ww).attr('height',H),g=svg.append('g').attr('transform',`translate(${m.l},${m.t})`);
  const x=d3.scaleLinear().domain([0,1]).range([0,iw]),y=d3.scaleLinear().domain([0,1]).range([ih,0]);
  g.append('g').call(d3.axisLeft(y).ticks(5).tickFormat(d=>d.toFixed(1))).call(gy=>{gy.select('.domain').attr('stroke',C.border);gy.selectAll('text').attr('font-size',10).attr('fill',C.muted);gy.selectAll('line').attr('stroke',C.border).attr('stroke-dasharray','3 2');});
  g.append('g').attr('transform',`translate(0,${ih})`).call(d3.axisBottom(x).ticks(5).tickFormat(d=>d.toFixed(1))).call(gx=>{gx.select('.domain').attr('stroke',C.border);gx.selectAll('text').attr('font-size',10).attr('fill',C.muted);gx.selectAll('line').attr('stroke',C.border);});
  g.append('line').attr('x1',0).attr('x2',iw).attr('y1',ih).attr('y2',0).attr('stroke',C.border).attr('stroke-width',1.5).attr('stroke-dasharray','5 4');
  const line=d3.line().x(d=>x(d[0])).y(d=>y(d[1])).curve(d3.curveCatmullRom);
  models.forEach((m,i)=>{const pts=m.roc.fpr.map((f,j)=>[f,m.roc.tpr[j]]);if(m.nombre===best.nombre){g.append('path').datum(pts).attr('d',d3.area().x(d=>x(d[0])).y0(ih).y1(d=>y(d[1])).curve(d3.curveCatmullRom)).attr('fill',cols[i]).attr('opacity',.1);}g.append('path').datum(pts).attr('d',line).attr('fill','none').attr('stroke',cols[i]).attr('stroke-width',m.nombre===best.nombre?3:2).attr('stroke-dasharray',dashes[i]||null);});
  const lg=g.append('g').attr('transform',`translate(${iw*.28},${ih*.06})`);
  models.forEach((m,i)=>{lg.append('line').attr('x1',0).attr('x2',22).attr('y1',i*20+7).attr('y2',i*20+7).attr('stroke',cols[i]).attr('stroke-width',m.nombre===best.nombre?3:2).attr('stroke-dasharray',dashes[i]||null);lg.append('text').attr('x',27).attr('y',i*20+12).attr('font-size',11).attr('fill',C.muted).attr('font-weight','700').text(`${m.nombre}  AUC ${m.auc}`);});
  g.append('text').attr('transform','rotate(-90)').attr('x',-ih/2).attr('y',-36).attr('text-anchor','middle').attr('font-size',10).attr('fill',C.muted).text('Sensibilidad (TPR)');
  g.append('text').attr('x',iw/2).attr('y',ih+40).attr('text-anchor','middle').attr('font-size',10).attr('fill',C.muted).text('1 − Especificidad (FPR)');
}

function buildG13(){
  document.getElementById('g13').innerHTML='';
  const best=D.modelos.reduce((a,b)=>a.auc>b.auc?a:b),cm=best.confusion_matrix,labels=['Rechazado','Aprobado'],totals=[cm[0].reduce((a,b)=>a+b),cm[1].reduce((a,b)=>a+b)],total=totals.reduce((a,b)=>a+b),correct=cm[0][0]+cm[1][1];
  document.getElementById('i13').textContent=`Clasifica correctamente ${correct.toLocaleString('es-CO')} de ${total.toLocaleString('es-CO')} casos (${(correct/total*100).toFixed(1)}%). Los ${cm[1][0].toLocaleString('es-CO')} falsos negativos son el error de mayor impacto en negocio.`;
  const maxV=Math.max(...cm.flat()),Ww=W('g13'),cellSz=Math.min((Ww-180)/2,130),H=cellSz*2+100,offX=(Ww-cellSz*2)/2,offY=52;
  const svg=d3.select('#g13').append('svg').attr('width',Ww).attr('height',H);
  cm.forEach((row,ri)=>row.forEach((val,ci)=>{const isOk=ri===ci,c=isOk?(ri===0?C.blue:C.green):C.orange,fill=isOk?d3.interpolate('#EEF0F7',c)(val/maxV):'#FEF4E6',xx=offX+ci*cellSz,yy=offY+ri*cellSz;svg.append('rect').attr('x',xx+2).attr('y',yy+2).attr('width',cellSz-6).attr('height',cellSz-6).attr('fill',fill).attr('rx',12).attr('stroke',c).attr('stroke-width',isOk?2:1.5).on('mouseover',e=>ST(e,`Real: ${labels[ri]} · Predicho: ${labels[ci]}: ${val.toLocaleString('es-CO')} (${(val/totals[ri]*100).toFixed(1)}%)`)).on('mouseout',HT);svg.append('text').attr('x',xx+cellSz/2).attr('y',yy+cellSz/2-10).attr('text-anchor','middle').attr('font-size',22).attr('font-weight','800').attr('font-family',"'Inter',sans-serif").attr('fill',val>maxV*.55?'white':C.text).text(d3.format(',')(val));svg.append('text').attr('x',xx+cellSz/2).attr('y',yy+cellSz/2+14).attr('text-anchor','middle').attr('font-size',11).attr('font-weight','600').attr('fill',val>maxV*.55?'rgba(255,255,255,.8)':C.muted).text(`${(val/totals[ri]*100).toFixed(1)}%`);svg.append('text').attr('x',xx+cellSz/2).attr('y',yy+cellSz-12).attr('text-anchor','middle').attr('font-size',10).attr('fill',val>maxV*.55?'rgba(255,255,255,.6)':C.light).text(isOk?'✓ Correcto':'✗ Error');}));
  labels.forEach((lbl,i)=>{svg.append('text').attr('x',offX+i*cellSz+cellSz/2).attr('y',offY-14).attr('text-anchor','middle').attr('font-size',12).attr('fill',C.muted).attr('font-weight','700').text(lbl);svg.append('text').attr('x',offX-12).attr('y',offY+i*cellSz+cellSz/2).attr('text-anchor','end').attr('dominant-baseline','middle').attr('font-size',12).attr('fill',C.muted).attr('font-weight','700').text(lbl);});
  svg.append('text').attr('x',offX+cellSz).attr('y',offY-30).attr('text-anchor','middle').attr('font-size',11).attr('fill',C.muted).attr('font-weight','700').text('Predicho →');
  svg.append('text').attr('x',offX-48).attr('y',offY+cellSz).attr('text-anchor','middle').attr('font-size',11).attr('fill',C.muted).attr('font-weight','700').attr('transform',`rotate(-90,${offX-48},${offY+cellSz})`).text('Real →');
}

function build3CM(){
  document.getElementById('g3cm').innerHTML='';
  const cols=[C.orange,C.blue2,C.green];
  D.modelos.forEach((m,mi)=>{
    const cm=m.confusion_matrix,wrap=document.createElement('div');wrap.style.cssText='padding:.5rem';document.getElementById('g3cm').appendChild(wrap);
    const el=document.createElementNS('http://www.w3.org/2000/svg','svg'),W2=document.getElementById('g3cm').offsetWidth/3-16,cSz=Math.min((W2-40)/2,70),H2=cSz*2+80;
    el.setAttribute('width',W2);el.setAttribute('height',H2);wrap.appendChild(el);
    const svg=d3.select(el),off={x:(W2-cSz*2)/2,y:26},maxV=Math.max(...cm.flat()),lbl=['Rech.','Aprov.'];
    svg.append('text').attr('x',W2/2).attr('y',14).attr('text-anchor','middle').attr('font-size',11).attr('font-weight','700').attr('fill','#111827').text(m.nombre);
    cm.forEach((row,ri)=>row.forEach((val,ci)=>{const isOk=ri===ci,c=isOk?(ri===0?C.blue:C.green):C.orange,fill=isOk?d3.interpolate('#EEF0F7',c)(val/maxV*.9):'#FEF4E6',xx=off.x+ci*cSz,yy=off.y+ri*cSz;svg.append('rect').attr('x',xx+1).attr('y',yy+1).attr('width',cSz-4).attr('height',cSz-4).attr('fill',fill).attr('rx',8).attr('stroke',c).attr('stroke-width',isOk?1.5:1);svg.append('text').attr('x',xx+cSz/2).attr('y',yy+cSz/2-4).attr('text-anchor','middle').attr('font-size',11).attr('font-weight','800').attr('font-family',"'Inter',sans-serif").attr('fill',val>maxV*.5?'white':C.text).text(d3.format(',')(val));svg.append('text').attr('x',xx+cSz/2).attr('y',yy+cSz/2+10).attr('text-anchor','middle').attr('font-size',9).attr('fill',val>maxV*.5?'rgba(255,255,255,.7)':C.muted).text(isOk?'✓':'✗');}));
    lbl.forEach((l,i)=>{svg.append('text').attr('x',off.x+i*cSz+cSz/2).attr('y',off.y-6).attr('text-anchor','middle').attr('font-size',9).attr('fill',C.muted).attr('font-weight','700').text(l);svg.append('text').attr('x',off.x-5).attr('y',off.y+i*cSz+cSz/2).attr('text-anchor','end').attr('dominant-baseline','middle').attr('font-size',9).attr('fill',C.muted).attr('font-weight','700').text(l);});
    svg.append('text').attr('x',W2/2).attr('y',H2-8).attr('text-anchor','middle').attr('font-size',9).attr('font-family',"'Inter',sans-serif").attr('font-weight','700').attr('fill','#111827').text(`AUC ${m.auc}`);
  });
}

// FIX 2: Curva PR calculada desde datos ROC reales del JSON
function buildPR(){
  document.getElementById('gpr').innerHTML='';
  const best=D.modelos.reduce((a,b)=>a.auc>b.auc?a:b);
  const fpr=best.roc.fpr,tpr=best.roc.tpr;
  const cm=best.confusion_matrix,total_pos=cm[1].reduce((a,b)=>a+b),total_neg=cm[0].reduce((a,b)=>a+b),ratio=total_neg/total_pos;
  const prPts=tpr.map((t,i)=>{const f=fpr[i],prec=t===0&&f===0?1:t/(t+f*ratio+1e-9);return[t,Math.min(1,Math.max(0,prec))];}).filter(p=>p[0]>0).sort((a,b)=>a[0]-b[0]);
  const Ww=W('gpr'),H=250,m={t:20,r:20,b:45,l:50},iw=Ww-m.l-m.r,ih=H-m.t-m.b;
  const svg=d3.select('#gpr').append('svg').attr('width',Ww).attr('height',H),g=svg.append('g').attr('transform',`translate(${m.l},${m.t})`);
  const x=d3.scaleLinear().domain([0,1]).range([0,iw]),y=d3.scaleLinear().domain([0,1]).range([ih,0]);
  g.append('g').call(d3.axisLeft(y).ticks(5).tickFormat(d=>d.toFixed(1))).call(gy=>{gy.select('.domain').attr('stroke',C.border);gy.selectAll('text').attr('font-size',10).attr('fill',C.muted);gy.selectAll('line').attr('stroke',C.border).attr('stroke-dasharray','3 2');});
  g.append('g').attr('transform',`translate(0,${ih})`).call(d3.axisBottom(x).ticks(5).tickFormat(d=>d.toFixed(1))).call(gx=>{gx.select('.domain').attr('stroke',C.border);gx.selectAll('text').attr('font-size',10).attr('fill',C.muted);gx.selectAll('line').attr('stroke',C.border);});
  const basePrec=total_pos/(total_pos+total_neg);
  g.append('line').attr('x1',0).attr('x2',iw).attr('y1',y(basePrec)).attr('y2',y(basePrec)).attr('stroke',C.border).attr('stroke-width',1.5).attr('stroke-dasharray','5 4');
  g.append('text').attr('x',iw-4).attr('y',y(basePrec)-6).attr('text-anchor','end').attr('font-size',9).attr('fill',C.light).text(`Aleatorio (${(basePrec*100).toFixed(1)}%)`);
  g.append('path').datum(prPts).attr('d',d3.line().x(d=>x(d[0])).y(d=>y(d[1])).curve(d3.curveCatmullRom)).attr('fill','none').attr('stroke',C.green).attr('stroke-width',2.5);
  g.append('path').datum(prPts).attr('d',d3.area().x(d=>x(d[0])).y0(ih).y1(d=>y(d[1])).curve(d3.curveCatmullRom)).attr('fill',C.green).attr('opacity',.08);
  const p05=prPts.find(p=>Math.abs(p[0]-0.81)<0.05)||prPts[Math.floor(prPts.length*.6)];
  g.append('circle').attr('cx',x(p05[0])).attr('cy',y(p05[1])).attr('r',7).attr('fill',C.orange).attr('stroke','white').attr('stroke-width',2);
  g.append('text').attr('x',x(p05[0])+10).attr('y',y(p05[1])-8).attr('font-size',10).attr('font-family',"'Inter',sans-serif").attr('font-weight','700').attr('fill',C.orange2).text('umbral ≈ 0.5');
  const p04=prPts.find(p=>Math.abs(p[0]-0.91)<0.05)||prPts[Math.floor(prPts.length*.75)];
  g.append('circle').attr('cx',x(p04[0])).attr('cy',y(p04[1])).attr('r',7).attr('fill',C.blue).attr('stroke','white').attr('stroke-width',2);
  g.append('text').attr('x',x(p04[0])+10).attr('y',y(p04[1])+4).attr('font-size',10).attr('font-family',"'Inter',sans-serif").attr('font-weight','700').attr('fill',C.blue2).text('umbral ≈ 0.4');
  g.append('text').attr('transform','rotate(-90)').attr('x',-ih/2).attr('y',-36).attr('text-anchor','middle').attr('font-size',10).attr('fill',C.muted).text('Precisión');
  g.append('text').attr('x',iw/2).attr('y',ih+36).attr('text-anchor','middle').attr('font-size',10).attr('fill',C.muted).text('Recall (sensibilidad)');
  g.append('text').attr('x',iw-4).attr('y',14).attr('text-anchor','end').attr('font-size',11).attr('font-family',"'Inter',sans-serif").attr('font-weight','700').attr('fill',C.green).text(`${best.nombre} · AUC ${best.auc}`);
}

function buildFI(sel,data,c){
  const sorted=[...data].sort((a,b)=>a.v-b.v),Ww=W(sel),H=240,m={t:10,r:65,b:20,l:170},iw=Ww-m.l-m.r,ih=H-m.t-m.b;
  const svg=d3.select('#'+sel).append('svg').attr('width',Ww).attr('height',H),g=svg.append('g').attr('transform',`translate(${m.l},${m.t})`);
  const x=d3.scaleLinear().domain([0,d3.max(sorted,d=>d.v)*1.15]).range([0,iw]),y=d3.scaleBand().domain(sorted.map(d=>d.label)).range([0,ih]).padding(.3);
  g.selectAll('.b').data(sorted).join('rect').attr('x',0).attr('y',d=>y(d.label)).attr('width',0).attr('height',y.bandwidth()).attr('fill',(d,i)=>d3.interpolate(C.bg,c)(.3+i/sorted.length*.7)).attr('rx',6).on('mouseover',(e,d)=>ST(e,`${d.label}: ${(d.v*100).toFixed(1)}%`)).on('mouseout',HT).transition().duration(600).ease(d3.easeCubicOut).attr('width',d=>x(d.v));
  g.selectAll('.v').data(sorted).join('text').attr('x',d=>x(d.v)+5).attr('y',d=>y(d.label)+y.bandwidth()/2).attr('dominant-baseline','middle').attr('font-size',11).attr('font-family',"'Inter',sans-serif").attr('font-weight','700').attr('fill','#111827').attr('opacity',0).text(d=>(d.v*100).toFixed(1)+'%').transition().delay(550).duration(200).attr('opacity',1);
  g.append('g').call(d3.axisLeft(y).tickSize(0)).call(gy=>{gy.select('.domain').remove();gy.selectAll('text').attr('font-size',10).attr('fill',C.muted).attr('font-weight','600').attr('dx','-6');});
}

// FIX 1: buildG14a con su propio insight
function buildG14a(){
  document.getElementById('g14a').innerHTML='';
  buildFI('g14a',D.feature_importance.random_forest,C.blue);
  const top=D.feature_importance.random_forest[0];
  document.getElementById('i14a').textContent=`${top.label} lidera en RF con ${(top.v*100).toFixed(1)}% de importancia. RF distribuye el peso entre más variables que XGBoost.`;
}

// FIX 3: buildG14b en contenedor gf propio
function buildG14b(){
  document.getElementById('g14b').innerHTML='';
  buildFI('g14b',D.feature_importance.xgboost,C.green);
  const top=D.feature_importance.xgboost[0];
  document.getElementById('i14b').textContent=`${top.label} lidera en XGBoost con ${(top.v*100).toFixed(1)}% de importancia. Ambos modelos coinciden en las variables más relevantes, validando la robustez del hallazgo.`;
}

function buildG15(){
  document.getElementById('g15').innerHTML='';
  const models=D.modelos,cols=[C.orange,C.blue,C.green],maxGap=models.reduce((a,b)=>Math.abs(b.train_acc-b.test_acc)>Math.abs(a.train_acc-a.test_acc)?b:a);
  document.getElementById('i15').textContent=`${maxGap.nombre} tiene la mayor brecha (Δ${(maxGap.train_acc-maxGap.test_acc).toFixed(1)}%). La Regresión Logística generaliza mejor con mínima diferencia Train-Test.`;
  const allAcc=[...models.map(m=>m.train_acc),...models.map(m=>m.test_acc)],Ww=W('g15'),H=250,m={t:20,r:20,b:55,l:50},iw=Ww-m.l-m.r,ih=H-m.t-m.b;
  const svg=d3.select('#g15').append('svg').attr('width',Ww).attr('height',H),g=svg.append('g').attr('transform',`translate(${m.l},${m.t})`);
  const x0=d3.scaleBand().domain(models.map(m=>m.nombre)).range([0,iw]).padding(.3),x1=d3.scaleBand().domain(['train','test']).range([0,x0.bandwidth()]).padding(.08),y=d3.scaleLinear().domain([d3.min(allAcc)*.97,d3.max(allAcc)*1.02]).range([ih,0]);
  g.append('g').call(d3.axisLeft(y).ticks(5).tickFormat(d=>d.toFixed(0)+'%')).call(gy=>{gy.select('.domain').attr('stroke',C.border);gy.selectAll('text').attr('font-size',10).attr('fill',C.muted);gy.selectAll('line').attr('stroke',C.border).attr('stroke-dasharray','3 2');});
  models.forEach((m,i)=>{
    [['train',m.train_acc,.55],['test',m.test_acc,1]].forEach(([key,val,op],ki)=>{g.append('rect').attr('x',x0(m.nombre)+x1(key)).attr('y',ih).attr('width',x1.bandwidth()).attr('height',0).attr('fill',cols[i]).attr('rx',6).attr('opacity',op).on('mouseover',e=>ST(e,`${m.nombre} · ${key==='train'?'Train':'Test'}: ${val.toFixed(1)}%`)).on('mouseout',HT).transition().delay(ki*80).duration(600).ease(d3.easeCubicOut).attr('y',y(val)).attr('height',ih-y(val));g.append('text').attr('x',x0(m.nombre)+x1(key)+x1.bandwidth()/2).attr('y',y(val)-6).attr('text-anchor','middle').attr('font-size',10).attr('font-family',"'Inter',sans-serif").attr('font-weight','700').attr('fill','#111827').attr('opacity',0).text(val.toFixed(1)+'%').transition().delay(ki*80+550).duration(200).attr('opacity',1);});
    const gap=m.train_acc-m.test_acc,mx=x0(m.nombre)+x0.bandwidth()/2;
    g.append('line').attr('x1',mx).attr('x2',mx).attr('y1',y(m.train_acc)).attr('y2',y(m.test_acc)).attr('stroke',C.orange).attr('stroke-width',2).attr('stroke-dasharray','4 2').attr('opacity',.8);
    g.append('text').attr('x',mx+4).attr('y',(y(m.train_acc)+y(m.test_acc))/2).attr('dominant-baseline','middle').attr('font-size',10).attr('font-family',"'Inter',sans-serif").attr('font-weight','700').attr('fill',C.orange2).text(`Δ${gap.toFixed(1)}%`);
    g.append('text').attr('x',x0(m.nombre)+x0.bandwidth()/2).attr('y',ih+18).attr('text-anchor','middle').attr('font-size',11).attr('fill',C.muted).attr('font-weight','700').text(m.nombre);
  });
  g.append('g').attr('transform',`translate(0,${ih})`).call(d3.axisBottom(x0).tickSize(0).tickFormat('')).call(gx=>{gx.select('.domain').attr('stroke',C.border);});
  const lg=svg.append('g').attr('transform',`translate(${m.l},${H-12})`);
  [['Train Accuracy',.55],['Test Accuracy',1]].forEach(([lbl,op],i)=>{lg.append('rect').attr('x',i*135).attr('y',0).attr('width',12).attr('height',8).attr('fill',C.muted).attr('opacity',op).attr('rx',3);lg.append('text').attr('x',i*135+16).attr('y',8).attr('font-size',10).attr('fill',C.muted).attr('font-weight','600').text(lbl);});
  lg.append('text').attr('x',275).attr('y',8).attr('font-size',10).attr('fill',C.orange2).attr('font-weight','700').text('Δ Brecha train–test');
}
// ── PREDICTOR — llama al backend FastAPI ──
async function runPredictor(){
  const defaultVal = document.getElementById('p-default').value;
  const home   = document.getElementById('p-home').value;
  const income = parseFloat(document.getElementById('p-income').value);
  const loan   = parseFloat(document.getElementById('p-loan').value);
  const rate   = parseFloat(document.getElementById('p-rate').value);
  const intent = document.getElementById('p-intent').value;

  if(!defaultVal || [income, loan, rate].some(isNaN) || !home || !intent){
    alert('Por favor completa todos los campos antes de simular.');
    return;
  }

  // Validacion de rangos del dataset
  if(income < 8000 || income > 271262){
    alert('Ingreso anual fuera de rango. Valores validos: $8,000 a $271,262.');
    return;
  }
  if(loan < 500 || loan > 35000){
    alert('Monto del prestamo fuera de rango. Valores validos: $500 a $35,000.');
    return;
  }
  if(loan > income){
    alert('El monto del prestamo no puede ser mayor que el ingreso anual.');
    return;
  }
  if(rate < 5.42 || rate > 20){
    alert('Tasa de interes fuera de rango. Valores validos: 5.42% a 20%.');
    return;
  }

  const btn = document.querySelector('.pred-btn');
  btn.textContent = 'Calculando...';
  btn.disabled = true;

  try {
    const response = await fetch('/predecir', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({
        previous_loan_defaults: defaultVal,
        person_home_ownership:  home,
        person_income:          income,
        loan_amnt:              loan,
        loan_int_rate:          rate,
        loan_intent:            intent
      })
    });

    const resultado = await response.json();

    if(resultado.error){
      alert('Error: ' + resultado.error);
      return;
    }

    mostrarResultado(resultado, {income, loan, rate, home});

  } catch(err) {
    alert('❌ Error conectando con el servidor. Asegúrate de que FastAPI esté corriendo con: uvicorn app:app --reload');
    console.error(err);
  } finally {
    btn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg> Simular aprobación';
    btn.disabled = false;
  }
}

function mostrarResultado(resultado, inputs){
  const wrap = document.getElementById('pred-result-wrap');
  if(!wrap) return;
  wrap.style.display = 'block';
  wrap.scrollIntoView({behavior:'smooth', block:'start'});

  const approved = resultado.aprobado;
  const pct      = resultado.probabilidad;

  // Veredicto principal
  const card = document.getElementById('pred-verdict-card');
  if(card) card.className = 'pred-verdict-card ' + (approved ? 'approved' : 'rejected');
  const iconEl = document.getElementById('pred-verdict-icon');
  if(iconEl) iconEl.textContent = approved ? '✓' : '✗';
  const labelEl = document.getElementById('pred-verdict-label');
  if(labelEl) labelEl.textContent = resultado.nivel;
  const pctEl = document.getElementById('pred-verdict-pct');
  if(pctEl) pctEl.textContent = `${pct}% de probabilidad de aprobación`;

  const fill = document.getElementById('pred-bar-fill');
  if(fill){
    fill.style.width = '0%';
    fill.style.background = approved ? C.green : C.red;
    setTimeout(()=>{ fill.style.width = pct+'%'; }, 100);
  }

  // Modelos (XGBoost es el real, los otros son referencia visual)
  const modelsEl = document.getElementById('pred-models');
  if(modelsEl) modelsEl.innerHTML = `<div class="pred-model-row">
    <span class="pred-model-name">⚡ XGBoost (modelo principal)</span>
    <span class="pred-model-result ${approved?'ok':'no'}">${approved?'Aprobado':'Rechazado'} — ${pct}%</span>
  </div>`;

  // Importancia de variables
  const impEl = document.getElementById('pred-importance');
  const topFI = (D?.feature_importance?.random_forest||[]).slice(0,6);
  if(impEl && topFI.length > 0){
    impEl.innerHTML = topFI.map(fi=>{
      const barW = Math.round(fi.v*100/(topFI[0].v)*100);
      return `<div class="pred-imp-row">
        <span class="pred-imp-label">${fi.label}</span>
        <div class="pred-imp-bar-bg"><div class="pred-imp-bar-fill" style="width:0%;background:${C.blue}" data-w="${barW}"></div></div>
        <span class="pred-imp-val">${(fi.v*100).toFixed(1)}%</span>
      </div>`;
    }).join('');
    setTimeout(()=>{
      impEl.querySelectorAll('.pred-imp-bar-fill').forEach(b=>{ b.style.width=b.dataset.w+'%'; });
    }, 200);
  }

  // Recomendaciones si rechazado
  const recsCard = document.getElementById('pred-recs-card');
  const recsEl   = document.getElementById('pred-recs');
  const recs = [];
  const pct_income = inputs.income > 0 ? inputs.loan/inputs.income : 0;

  if(pct_income > 0.20) recs.push({icon:'💰', title:'Reduce el % del ingreso destinado al préstamo',
      desc:`Actualmente es ${(pct_income*100).toFixed(1)}%. El perfil ideal está por debajo del 20%. Considera solicitar un monto menor o aumentar tu ingreso documentado.`});
  if(inputs.rate > 14) recs.push({icon:'📉', title:'Busca una tasa de interés más competitiva',
      desc:`Tu tasa de ${inputs.rate}% está por encima del promedio de aprobados (≈12%). Comparar con otras entidades puede mejorar tu perfil.`});
  if(inputs.home === 'RENT') recs.push({icon:'🏠', title:'Considera añadir un co-solicitante con activos',
      desc:'Vivir en alquiler reduce ligeramente la confianza del modelo. Un co-solicitante propietario puede compensarlo.'});

  if(recsCard && recsEl){
    if(recs.length > 0 && !approved){
      recsCard.style.display = 'block';
      recsEl.innerHTML = recs.map(r=>`
        <div class="pred-rec-item">
          <div class="pred-rec-icon">${r.icon}</div>
          <div class="pred-rec-body">
            <div class="pred-rec-title">${r.title}</div>
            <div class="pred-rec-desc">${r.desc}</div>
          </div>
        </div>`).join('');
    } else {
      recsCard.style.display = 'none';
    }
  }
}
// ═══════════════════════════════════════════════
// MODAL — EXPAND CHART
// ═══════════════════════════════════════════════

const MODAL_META = {
  g01: {
    title: 'Distribución de loan_status',
    sub: 'Aprobados vs rechazados sobre el total de solicitudes',
    build: (el) => {
      el.innerHTML = '';
      const ds = D.dataset, pct = (ds.aprobados/ds.total*100).toFixed(1);
      const data = [{label:'Aprobados (loan_status = 1)',v:ds.aprobados,c:C.green},{label:'Rechazados (loan_status = 0)',v:ds.rechazados,c:C.red}];
      const Ww = el.offsetWidth||700, H = 180, m = {t:10,r:10,b:10,l:240}, iw = Ww-m.l-m.r, ih = H-m.t-m.b;
      const svg = d3.select(el).append('svg').attr('width',Ww).attr('height',H);
      const g = svg.append('g').attr('transform',`translate(${m.l},${m.t})`);
      const x = d3.scaleLinear().domain([0,ds.total]).range([0,iw]), y = d3.scaleBand().domain(data.map(d=>d.label)).range([0,ih]).padding(.4);
      g.selectAll('.b').data(data).join('rect').attr('x',0).attr('y',d=>y(d.label)).attr('width',0).attr('height',y.bandwidth()).attr('fill',d=>d.c).attr('rx',8).transition().duration(700).ease(d3.easeCubicOut).attr('width',d=>x(d.v));
      g.selectAll('.v').data(data).join('text').attr('x',d=>x(d.v)+10).attr('y',d=>y(d.label)+y.bandwidth()/2).attr('dominant-baseline','middle').attr('font-size',14).attr('font-weight','700').attr('fill',d=>d.c).attr('opacity',0).text(d=>`${d.v.toLocaleString('es-CO')} · ${(d.v/ds.total*100).toFixed(1)}%`).transition().delay(600).duration(200).attr('opacity',1);
      g.append('g').call(d3.axisLeft(y).tickSize(0)).call(gy=>{gy.select('.domain').remove();gy.selectAll('text').attr('font-size',13).attr('fill',C.muted).attr('font-weight','600').attr('dx','-8');});
    },
    explain: {
      que: 'Muestra cuántas solicitudes del dataset fueron aprobadas (loan_status=1) y rechazadas (loan_status=0).',
      hallazgo: `El dataset está fuertemente desbalanceado: solo el 22.3% de solicitudes fueron aprobadas frente al 77.7% rechazadas. Este desbalance 1:3.5 es la razón principal por la que se aplicó SMOTE durante el entrenamiento.`,
      stats: [
        {l:'Total solicitudes', v:'44,540'},
        {l:'Aprobados', v:'9,942 (22.3%)'},
        {l:'Rechazados', v:'34,598 (77.7%)'},
        {l:'Ratio', v:'1 : 3.5'},
      ],
      color: 'ins-red'
    }
  },
  g02: {
    title: 'Flujo de aprobación — evaluación completa del perfil',
    sub: 'Todas las solicitudes son evaluadas por el modelo XGBoost',
    build: (el) => { el.innerHTML=''; buildG02(); const orig=document.getElementById('g02'); const svg=orig.querySelector('svg'); if(svg){ const clone=svg.cloneNode(true); clone.setAttribute('width', el.offsetWidth||700); el.appendChild(clone); } },
    explain: {
      que: 'Diagrama de flujo que muestra cómo se procesan las 44,540 solicitudes: todas pasan por XGBoost sin filtros previos.',
      hallazgo: 'A diferencia de sistemas tradicionales con reglas duras (rechazar automáticamente por default previo), este modelo evalúa el perfil completo de cada solicitante. Esto permite recuperar perfiles válidos que habrían sido rechazados automáticamente.',
      stats: [
        {l:'Con default previo', v:'22,594 (50.7%)'},
        {l:'Sin default previo', v:'21,946 (49.3%)'},
        {l:'Evaluados por XGBoost', v:'44,540 (100%)'},
      ],
      color: 'ins-blue'
    }
  },
  g03: {
    title: '% del ingreso destinado al préstamo',
    sub: 'loan_percent_income — violin + boxplot por resultado (aprobado vs rechazado)',
    build: (el) => { el.innerHTML=''; const d=D.distribuciones.loan_percent_income; violin2(el,'g03m',d.aprobados,d.rechazados,[0,100],v=>v+'%'); },
    explain: {
      que: 'Distribución de la proporción entre el monto del préstamo y el ingreso anual del solicitante, separada por resultado.',
      hallazgo: 'Es la variable con mayor poder discriminante. Los aprobados destinan en mediana ~20% de su ingreso al préstamo, mientras que los rechazados destinan ~12%. Paradójicamente los rechazados piden proporcionalmente menos — esto indica que los rechazados tienen perfiles de riesgo más altos en otras variables.',
      stats: [
        {l:'Mediana aprobados', v:'~20%'},
        {l:'Mediana rechazados', v:'~12%'},
        {l:'Correlación con target', v:'r = +0.39'},
        {l:'Importancia XGBoost', v:'#2 variable'},
      ],
      color: 'ins-green'
    }
  },
  g04: {
    title: 'Tasa de interés del préstamo',
    sub: 'loan_int_rate — violin + boxplot por resultado',
    build: (el) => { el.innerHTML=''; const d=D.distribuciones.loan_int_rate; violin2(el,'g04m',d.aprobados,d.rechazados,[300,2100],v=>d3.format(',')(Math.round(v))); },
    explain: {
      que: 'Distribución de la tasa de interés asignada por el banco al crédito, separada entre aprobados y rechazados.',
      hallazgo: 'Paradoja interesante: los aprobados tienen tasas de interés más altas que los rechazados. La explicación es que la tasa la asigna el banco en función del riesgo percibido, no al revés. Perfiles con más carga de deuda pagan más interés y aun así son aprobados.',
      stats: [
        {l:'Correlación con target', v:'r = +0.33'},
        {l:'Importancia en modelo', v:'#1 variable'},
        {l:'Rango del dataset', v:'5.42% – 20%'},
      ],
      color: 'ins-orange'
    }
  },
  g05: {
    title: 'Tasa de aprobación por propósito del préstamo',
    sub: 'loan_intent — ordenado de mayor a menor aprobación',
    build: (el) => { el.innerHTML=''; const data=D.proposito; const avg=D.dataset.aprobados/D.dataset.total*100; const Ww=el.offsetWidth||700,H=260,m={t:10,r:70,b:30,l:160},iw=Ww-m.l-m.r,ih=H-m.t-m.b; const svg=d3.select(el).append('svg').attr('width',Ww).attr('height',H); const g=svg.append('g').attr('transform',`translate(${m.l},${m.t})`); const x=d3.scaleLinear().domain([0,d3.max(data,d=>d.pct)*1.15]).range([0,iw]),y=d3.scaleBand().domain(data.map(d=>d.label)).range([0,ih]).padding(.3); g.selectAll('.b').data(data).join('rect').attr('x',0).attr('y',d=>y(d.label)).attr('width',0).attr('height',y.bandwidth()).attr('fill',(d,i)=>PAL[i%PAL.length]).attr('rx',6).transition().duration(600).ease(d3.easeCubicOut).attr('width',d=>x(d.pct)); g.selectAll('.v').data(data).join('text').attr('x',d=>x(d.pct)+6).attr('y',d=>y(d.label)+y.bandwidth()/2).attr('dominant-baseline','middle').attr('font-size',13).attr('font-weight','700').attr('fill','#111827').attr('opacity',0).text(d=>d.pct+'%').transition().delay(550).duration(200).attr('opacity',1); g.append('g').call(d3.axisLeft(y).tickSize(0)).call(gy=>{gy.select('.domain').remove();gy.selectAll('text').attr('font-size',12).attr('fill',C.muted).attr('font-weight','600').attr('dx','-6');}); g.append('g').attr('transform',`translate(0,${ih})`).call(d3.axisBottom(x).ticks(5).tickFormat(d=>d+'%')).call(gx=>{gx.select('.domain').attr('stroke',C.border);gx.selectAll('text').attr('font-size',10).attr('fill',C.muted);}); g.append('line').attr('x1',x(avg)).attr('x2',x(avg)).attr('y1',0).attr('y2',ih).attr('stroke',C.orange).attr('stroke-width',2).attr('stroke-dasharray','5 3'); g.append('text').attr('x',x(avg)+4).attr('y',10).attr('font-size',10).attr('fill',C.orange2).attr('font-weight','700').text(`Prom. ${avg.toFixed(1)}%`); },
    explain: {
      que: 'Tasa de aprobación desglosada por el propósito declarado del préstamo.',
      hallazgo: 'Los préstamos para educación y mejora del hogar tienen mayor tasa de aprobación, mientras que los de consolidación de deudas y personales tienen las más bajas. La diferencia entre extremos es de ~5 puntos porcentuales.',
      stats: [
        {l:'Mayor aprobación', v:'Educación ~25%'},
        {l:'Menor aprobación', v:'Consolidación ~20%'},
        {l:'Promedio general', v:'22.3%'},
      ],
      color: 'ins-blue'
    }
  },
  g06: {
    title: 'Variables que no predicen la aprobación',
    sub: 'Diferencia estadísticamente insignificante entre aprobados y rechazados',
    build: (el) => {
      el.innerHTML='';
      const data=D.no_predicen;
      if(!data||data.length===0){ el.innerHTML='<p style="color:var(--muted);font-size:12px;padding:1rem">Sin datos</p>'; return; }
      const t=document.createElement('table'); t.className='var-table'; t.style.fontSize='13px';
      t.innerHTML=`<thead><tr><th>Variable</th><th>Aprobados</th><th>Rechazados</th><th>Δ Diferencia</th><th>Interpretación</th></tr></thead><tbody>${data.map(d=>`<tr><td style="font-weight:600;color:${C.blue2}">${d.label}</td><td style="color:${C.green2};font-weight:600">${d.aprobados.toFixed(2)}</td><td style="color:${C.red2};font-weight:600">${d.rechazados.toFixed(2)}</td><td style="color:${C.muted};font-weight:700">${d.delta>0?'+':''}${d.delta.toFixed(2)}</td><td style="color:${C.muted};font-style:italic">Sin diferencia significativa</td></tr>`).join('')}</tbody>`;
      el.appendChild(t);
    },
    explain: {
      que: 'Variables numéricas cuya media entre aprobados y rechazados es prácticamente idéntica, confirmando que no aportan al modelo.',
      hallazgo: 'Edad, experiencia laboral, historial crediticio y puntaje crediticio muestran diferencias menores a 1 unidad entre grupos. Esto desafía la intuición financiera: tener un buen credit score no garantiza aprobación en este dataset.',
      stats: [
        {l:'Edad (Δ)', v:'-0.31 años'},
        {l:'Exp. laboral (Δ)', v:'-0.30 años'},
        {l:'Historial crédito (Δ)', v:'-0.14 años'},
        {l:'Puntaje crédito (Δ)', v:'-0.92 puntos'},
      ],
      color: 'ins-red'
    }
  },
  g07: {
    title: 'Diferencia (Δ) entre grupos por variable',
    sub: 'Lollipop divergente — magnitud y dirección del efecto discriminante',
    build: (el) => { el.innerHTML=''; const data=[...D.lollipop].sort((a,b)=>b.delta-a.delta); const Ww=el.offsetWidth||700,H=260,m={t:10,r:70,b:25,l:200},iw=Ww-m.l-m.r,ih=H-m.t-m.b; const svg=d3.select(el).append('svg').attr('width',Ww).attr('height',H); const g=svg.append('g').attr('transform',`translate(${m.l},${m.t})`); const y=d3.scaleBand().domain(data.map(d=>d.label)).range([0,ih]).padding(.4),ext=d3.max(data,d=>Math.abs(d.delta))*1.2,x=d3.scaleLinear().domain([-ext,ext]).range([0,iw]); g.append('line').attr('x1',x(0)).attr('x2',x(0)).attr('y1',0).attr('y2',ih).attr('stroke',C.border).attr('stroke-width',2); data.forEach(d=>{ const cy=y(d.label)+y.bandwidth()/2,c=d.delta>0.5?C.green:d.delta<-0.5?C.red:C.muted; g.append('line').attr('x1',x(0)).attr('x2',x(0)).attr('y1',cy).attr('y2',cy).attr('stroke',c).attr('stroke-width',3).transition().duration(600).attr('x2',x(d.delta)); g.append('circle').attr('cx',x(0)).attr('cy',cy).attr('r',8).attr('fill',c).attr('stroke','white').attr('stroke-width',2).transition().duration(600).attr('cx',x(d.delta)); g.append('text').attr('x',x(d.delta)+(d.delta>=0?14:-14)).attr('y',cy).attr('dominant-baseline','middle').attr('text-anchor',d.delta>=0?'start':'end').attr('font-size',12).attr('font-weight','700').attr('fill','#111827').attr('opacity',0).text((d.delta>0?'+':'')+d.delta).transition().delay(550).duration(200).attr('opacity',1); g.append('text').attr('x',-8).attr('y',cy).attr('dominant-baseline','middle').attr('text-anchor','end').attr('font-size',12).attr('fill',C.muted).attr('font-weight','600').text(d.label); }); g.append('g').attr('transform',`translate(0,${ih})`).call(d3.axisBottom(x).ticks(5).tickFormat(d=>d>0?'+'+d:d)).call(gx=>{gx.select('.domain').attr('stroke',C.border);gx.selectAll('text').attr('font-size',10).attr('fill',C.muted);}); },
    explain: {
      que: 'Diferencia de medias entre aprobados y rechazados para cada variable. Verde = aprobados tienen mayor valor. Rojo = rechazados tienen mayor valor.',
      hallazgo: 'loan_percent_income (Δ≈+8%) y loan_int_rate (Δ≈+2.4%) son las variables con mayor diferencia real entre grupos. Las variables con Δ≈0 confirman que no discriminan.',
      stats: [
        {l:'Mayor Δ positivo', v:'% ingreso al préstamo'},
        {l:'Mayor Δ negativo', v:'Ingreso anual'},
        {l:'Variables con Δ≈0', v:'Edad, score, historial'},
      ],
      color: 'ins-green'
    }
  },
  g08: {
    title: 'Selección del K óptimo — método del codo y Silhouette',
    sub: 'Inercia (azul) y Silhouette Score (verde) para K de 2 a 7',
    build: (el) => { el.innerHTML=''; const km=D.kmeans_eval; const Ww=el.offsetWidth||700,H=300,m={t:28,r:75,b:40,l:70},iw=Ww-m.l-m.r,ih=H-m.t-m.b; const svg=d3.select(el).append('svg').attr('width',Ww).attr('height',H); const g=svg.append('g').attr('transform',`translate(${m.l},${m.t})`); const x=d3.scalePoint().domain(km.ks.map(String)).range([0,iw]).padding(.3),y1=d3.scaleLinear().domain([d3.min(km.inercias)*.92,d3.max(km.inercias)*1.05]).range([ih,0]),y2=d3.scaleLinear().domain([d3.min(km.silhouettes)*.95,d3.max(km.silhouettes)*1.05]).range([ih,0]); g.append('g').call(d3.axisLeft(y1).ticks(4).tickSize(-iw).tickFormat('')).call(gy=>{gy.select('.domain').remove();gy.selectAll('line').attr('stroke',C.border).attr('stroke-dasharray','3 3');}); const lI=d3.line().x((_,i)=>x(String(km.ks[i]))).y(d=>y1(d)); g.append('path').datum(km.inercias).attr('d',lI).attr('fill','none').attr('stroke',C.blue).attr('stroke-width',2.5); km.inercias.forEach((v,i)=>{g.append('circle').attr('cx',x(String(km.ks[i]))).attr('cy',y1(v)).attr('r',6).attr('fill',C.blue).attr('stroke','white').attr('stroke-width',2);}); g.append('g').call(d3.axisLeft(y1).ticks(4).tickFormat(d=>(d/1000).toFixed(0)+'k')).call(gy=>{gy.select('.domain').attr('stroke',C.border);gy.selectAll('text').attr('font-size',11).attr('fill',C.blue);gy.selectAll('line').remove();}); const lS=d3.line().x((_,i)=>x(String(km.ks[i]))).y(d=>y2(d)); g.append('path').datum(km.silhouettes).attr('d',lS).attr('fill','none').attr('stroke',C.green).attr('stroke-width',2.5).attr('stroke-dasharray','6 3'); km.silhouettes.forEach((v,i)=>{g.append('circle').attr('cx',x(String(km.ks[i]))).attr('cy',y2(v)).attr('r',6).attr('fill',km.ks[i]===km.k_optimo?C.orange:C.green).attr('stroke','white').attr('stroke-width',2);}); g.append('g').attr('transform',`translate(${iw},0)`).call(d3.axisRight(y2).ticks(4).tickFormat(d=>d.toFixed(3))).call(gy=>{gy.select('.domain').attr('stroke',C.border);gy.selectAll('text').attr('font-size',11).attr('fill',C.green);gy.selectAll('line').remove();}); g.append('line').attr('x1',x(String(km.k_optimo))).attr('x2',x(String(km.k_optimo))).attr('y1',0).attr('y2',ih).attr('stroke',C.orange).attr('stroke-width',2).attr('stroke-dasharray','5 3'); g.append('text').attr('x',x(String(km.k_optimo))+6).attr('y',14).attr('font-size',11).attr('fill',C.orange2).attr('font-weight','700').text(`K=${km.k_optimo} ★`); g.append('g').attr('transform',`translate(0,${ih})`).call(d3.axisBottom(x).tickSize(0)).call(gx=>{gx.select('.domain').attr('stroke',C.border);gx.selectAll('text').attr('font-size',12).attr('fill',C.muted);}); g.append('text').attr('x',iw/2).attr('y',ih+32).attr('text-anchor','middle').attr('font-size',11).attr('fill',C.muted).text('Número de clusters (K)'); },
    explain: {
      que: 'Dos métricas para elegir el número óptimo de clusters K: la inercia (suma de distancias al centroide) y el Silhouette Score (separación entre clusters).',
      hallazgo: 'K=2 es el punto óptimo: tiene el Silhouette Score más alto (0.22) y el codo más pronunciado de la curva de inercia. El score de 0.22 es bajo, consistente con datos financieros continuos que naturalmente se solapan.',
      stats: [
        {l:'K óptimo', v:'K = 2'},
        {l:'Silhouette Score', v:'0.22 (K=2)'},
        {l:'Rango K evaluado', v:'2 a 7'},
      ],
      color: 'ins-blue'
    }
  },
  g10: {
    title: 'Tasa de aprobación por cluster',
    sub: 'Comparación entre clusters — ¿el perfil demográfico predice el resultado?',
    build: (el) => { el.innerHTML=''; const clusters=D.clusters,avg=clusters.reduce((s,c)=>s+c.tasa_aprov,0)/clusters.length,names=['Cluster 0 (Maduros)','Cluster 1 (Jóvenes)']; const Ww=el.offsetWidth||700,H=280,m={t:20,r:65,b:50,l:60},iw=Ww-m.l-m.r,ih=H-m.t-m.b; const svg=d3.select(el).append('svg').attr('width',Ww).attr('height',H),g=svg.append('g').attr('transform',`translate(${m.l},${m.t})`); const x=d3.scaleBand().domain(clusters.map((_,i)=>names[i])).range([0,iw]).padding(.4),y=d3.scaleLinear().domain([0,d3.max(clusters,c=>c.tasa_aprov)*1.4]).range([ih,0]); g.append('g').call(d3.axisLeft(y).ticks(5).tickFormat(d=>d+'%')).call(gy=>{gy.select('.domain').attr('stroke',C.border);gy.selectAll('text').attr('font-size',11).attr('fill',C.muted);gy.selectAll('line').attr('stroke',C.border).attr('stroke-dasharray','3 2');}); clusters.forEach((cl,i)=>{const c=[C.cl0,C.cl1][i];g.append('rect').attr('x',x(names[i])).attr('y',ih).attr('width',x.bandwidth()).attr('height',0).attr('fill',c).attr('rx',8).attr('opacity',.9).transition().duration(600).ease(d3.easeCubicOut).attr('y',y(cl.tasa_aprov)).attr('height',ih-y(cl.tasa_aprov));g.append('text').attr('x',x(names[i])+x.bandwidth()/2).attr('y',y(cl.tasa_aprov)-10).attr('text-anchor','middle').attr('font-size',18).attr('font-weight','800').attr('fill','#111827').attr('opacity',0).text(cl.tasa_aprov+'%').transition().delay(550).duration(200).attr('opacity',1);g.append('text').attr('x',x(names[i])+x.bandwidth()/2).attr('y',ih+20).attr('text-anchor','middle').attr('font-size',13).attr('fill',C.muted).attr('font-weight','700').text(names[i]);g.append('text').attr('x',x(names[i])+x.bandwidth()/2).attr('y',ih+36).attr('text-anchor','middle').attr('font-size',11).attr('fill',C.light).text(`n = ${cl.n.toLocaleString('es-CO')}`); }); g.append('line').attr('x1',0).attr('x2',iw).attr('y1',y(avg)).attr('y2',y(avg)).attr('stroke',C.orange).attr('stroke-width',2).attr('stroke-dasharray','6 3'); g.append('text').attr('x',iw+6).attr('y',y(avg)).attr('dominant-baseline','middle').attr('font-size',11).attr('fill',C.orange2).attr('font-weight','700').text(avg.toFixed(1)+'%'); },
    explain: {
      que: 'Tasa de aprobación de préstamos dentro de cada cluster identificado por K-Means.',
      hallazgo: 'Los dos clusters tienen tasas de aprobación casi idénticas (~22%). Esto demuestra que la segmentación demográfica (jóvenes vs maduros) NO predice el resultado crediticio. El riesgo financiero no está determinado por la edad o experiencia.',
      stats: [
        {l:'Cluster 0 (Maduros)', v:`${D.clusters[0]?.tasa_aprov}%`},
        {l:'Cluster 1 (Jóvenes)', v:`${D.clusters[1]?.tasa_aprov}%`},
        {l:'Diferencia entre clusters', v:'< 1%'},
      ],
      color: 'ins-orange'
    }
  },
  gpca: {
    title: 'Visualización PCA — separación de clusters en 2D',
    sub: '800 puntos proyectados con PCA · colores = clusters K-Means',
    build: (el) => { el.innerHTML=''; const pca=D.pca,Ww=el.offsetWidth||700,H=380,m={t:10,r:20,b:40,l:55},iw=Ww-m.l-m.r,ih=H-m.t-m.b; const svg=d3.select(el).append('svg').attr('width',Ww).attr('height',H),g=svg.append('g').attr('transform',`translate(${m.l},${m.t})`); const x=d3.scaleLinear().domain(d3.extent(pca.pc1)).nice().range([0,iw]),y=d3.scaleLinear().domain(d3.extent(pca.pc2)).nice().range([ih,0]); g.append('g').call(d3.axisLeft(y).ticks(5).tickFormat(d=>d.toFixed(1))).call(gy=>{gy.select('.domain').attr('stroke',C.border);gy.selectAll('text').attr('font-size',11).attr('fill',C.muted);gy.selectAll('line').attr('stroke',C.border).attr('stroke-dasharray','3 2');}); g.append('g').attr('transform',`translate(0,${ih})`).call(d3.axisBottom(x).ticks(5).tickFormat(d=>d.toFixed(1))).call(gx=>{gx.select('.domain').attr('stroke',C.border);gx.selectAll('text').attr('font-size',11).attr('fill',C.muted);gx.selectAll('line').attr('stroke',C.border);}); pca.pc1.forEach((pc1,i)=>{g.append('circle').attr('cx',x(pc1)).attr('cy',y(pca.pc2[i])).attr('r',4).attr('fill',[C.cl0,C.cl1][pca.cluster[i]]).attr('opacity',.55);}); g.append('text').attr('x',iw/2).attr('y',ih+32).attr('text-anchor','middle').attr('font-size',12).attr('fill',C.muted).text('PC1'); g.append('text').attr('transform','rotate(-90)').attr('x',-ih/2).attr('y',-38).attr('text-anchor','middle').attr('font-size',12).attr('fill',C.muted).text('PC2'); const lg=svg.append('g').attr('transform',`translate(${m.l+iw-150},${m.t+14})`); [['Cluster 0 — Maduros',C.cl0],['Cluster 1 — Jóvenes',C.cl1]].forEach(([lbl,c],i)=>{lg.append('circle').attr('cx',6).attr('cy',i*20).attr('r',6).attr('fill',c);lg.append('text').attr('x',17).attr('y',i*20+5).attr('font-size',11).attr('fill',C.muted).attr('font-weight','600').text(lbl);}); },
    explain: {
      que: 'Proyección de 8 variables financieras en 2 dimensiones principales (PCA) para visualizar la separación espacial de los clusters.',
      hallazgo: 'Los clusters se solapan considerablemente en el espacio PCA, lo cual es coherente con el Silhouette Score bajo (0.22). No hay una frontera clara, confirmando que los grupos se diferencian en perfil demográfico pero no en riesgo financiero.',
      stats: [
        {l:'Puntos mostrados', v:'800 (muestra)'},
        {l:'Variables reducidas', v:'8 → 2 dimensiones'},
        {l:'Silhouette Score', v:'0.22'},
      ],
      color: 'ins-blue'
    }
  },
  gradar: {
    title: 'Radar de perfil por cluster',
    sub: '8 variables superpuestas — diferencias demográficas entre clusters',
    build: (el) => { el.innerHTML=''; const clusters=D.clusters,vars=['person_age','person_emp_exp','credit_score','cred_hist_log','loan_int_rate','loan_percent_income','person_income_log','loan_amnt_log'],labels=['Edad','Experiencia','Credit score','Hist. crédito','Tasa interés','% Ingreso','Ingreso','Monto']; const raw=clusters.map(c=>vars.map(v=>c[v]||0)),mn=vars.map((_,i)=>Math.min(...raw.map(r=>r[i]))),mx=vars.map((_,i)=>Math.max(...raw.map(r=>r[i]))),norm=(v,i)=>mx[i]===mn[i]?.5:(v-mn[i])/(mx[i]-mn[i]); const n=vars.length,Ww=el.offsetWidth||700,H=340,cx=Ww/2,cy=H/2-10,R=110,angles=vars.map((_,i)=>i*2*Math.PI/n-Math.PI/2),pt=(r,i)=>[cx+r*Math.cos(angles[i]),cy+r*Math.sin(angles[i])]; const svg=d3.select(el).append('svg').attr('width',Ww).attr('height',H); [.25,.5,.75,1].forEach(s=>{const pts=angles.map((_,i)=>pt(R*s,i));svg.append('polygon').attr('points',pts.map(p=>p.join(',')).join(' ')).attr('fill','none').attr('stroke',C.border).attr('stroke-width',1);}); angles.forEach((a,i)=>{const[x2,y2]=pt(R,i);svg.append('line').attr('x1',cx).attr('y1',cy).attr('x2',x2).attr('y2',y2).attr('stroke',C.border).attr('stroke-width',1);const[lx,ly]=pt(R+22,i);svg.append('text').attr('x',lx).attr('y',ly).attr('text-anchor','middle').attr('dominant-baseline','middle').attr('font-size',11).attr('fill',C.muted).attr('font-weight','600').text(labels[i]);}); [[C.cl0,'Cluster 0'],[C.cl1,'Cluster 1']].forEach(([c,lbl],ci)=>{const nv=vars.map((v,i)=>norm(clusters[ci][v]||0,i)),pts=angles.map((a,i)=>pt(R*nv[i],i));svg.append('polygon').attr('points',pts.map(p=>p.join(',')).join(' ')).attr('fill',c).attr('fill-opacity',.18).attr('stroke',c).attr('stroke-width',2.5);pts.forEach(([px,py])=>svg.append('circle').attr('cx',px).attr('cy',py).attr('r',5).attr('fill',c).attr('stroke','white').attr('stroke-width',2));}); const lg=svg.append('g').attr('transform',`translate(${Ww/2-110},${H-16})`); [[C.cl0,'Cluster 0 — Maduros'],[C.cl1,'Cluster 1 — Jóvenes']].forEach(([c,lbl],i)=>{lg.append('circle').attr('cx',i*130+6).attr('cy',5).attr('r',6).attr('fill',c);lg.append('text').attr('x',i*130+16).attr('y',9).attr('font-size',11).attr('fill',C.muted).attr('font-weight','600').text(lbl);}); },
    explain: {
      que: 'Gráfica de radar que superpone el perfil normalizado de 8 variables para cada cluster, permitiendo comparación visual directa.',
      hallazgo: 'El Cluster 0 (Maduros) domina en edad, experiencia e historial crediticio. El Cluster 1 (Jóvenes) tiene mayor carga relativa del préstamo. Sin embargo, sus tasas de aprobación son casi iguales, mostrando que estas diferencias demográficas no determinan el riesgo.',
      stats: [
        {l:'Cluster 0: edad media', v:`${D.clusters[0]?.person_age?.toFixed(1)} años`},
        {l:'Cluster 1: edad media', v:`${D.clusters[1]?.person_age?.toFixed(1)} años`},
        {l:'Variables analizadas', v:'8 continuas'},
      ],
      color: 'ins-blue'
    }
  },
  gviolin_cluster: {
    title: '% del ingreso por cluster — variable más discriminante',
    sub: 'loan_percent_income comparada entre clusters',
    build: (el) => { el.innerHTML=''; const d=D.distribuciones.loan_percent_income; violin2(el,'gvmc',d.aprobados.slice(0,250),d.rechazados.slice(0,250),[0,100],v=>v+'%'); },
    explain: {
      que: 'Distribución de la variable más predictiva del modelo (loan_percent_income) visualizada por cluster K-Means.',
      hallazgo: 'La distribución de esta variable clave es similar entre clusters. Esto refuerza la conclusión de que los clusters K-Means no capturan el riesgo financiero real, ya que la variable más discriminante se distribuye igual en ambos grupos.',
      stats: [
        {l:'Variable', v:'loan_percent_income'},
        {l:'Importancia modelo', v:'Top 2 variables'},
        {l:'Distribución clusters', v:'Similar en ambos'},
      ],
      color: 'ins-orange'
    }
  },
  g09: {
    title: 'Perfil promedio normalizado por cluster — heatmap',
    sub: 'Valores normalizados 0–1 con valores reales anotados en cada celda',
    build: (el) => { el.innerHTML=''; const clusters=D.clusters,vars=['person_age','person_income_log','person_emp_exp','loan_amnt_log','loan_int_rate','loan_percent_income','cred_hist_log','credit_score'],labels=['Edad','Ingreso log','Exp. laboral','Monto log','Tasa interés','% ingreso','Hist. crédito','Credit score'],cols=[C.cl0,C.cl1],names=clusters.map((_,i)=>`Cluster ${i} — ${i===0?'Maduros':'Jóvenes'}`); const raw=clusters.map(c=>vars.map(v=>c[v]||0)),mn=vars.map((_,i)=>Math.min(...raw.map(r=>r[i]))),mx=vars.map((_,i)=>Math.max(...raw.map(r=>r[i]))),norm=(v,i)=>mx[i]===mn[i]?.5:(v-mn[i])/(mx[i]-mn[i]); const Ww=el.offsetWidth||700,cellH=44,m={t:10,r:20,b:60,l:180},iw=Ww-m.l-m.r,cw=iw/vars.length,H=clusters.length*cellH+m.t+m.b+10; const svg=d3.select(el).append('svg').attr('width',Ww).attr('height',H),g=svg.append('g').attr('transform',`translate(${m.l},${m.t})`); clusters.forEach((cl,ri)=>{g.append('text').attr('x',-8).attr('y',ri*cellH+cellH/2).attr('dominant-baseline','middle').attr('text-anchor','end').attr('font-size',13).attr('fill',cols[ri]).attr('font-weight','700').text(names[ri]);vars.forEach((v,ci)=>{const val=cl[v]||0,n=norm(val,ci),fill=d3.interpolate('#EEF0F7',cols[ri])(n);g.append('rect').attr('x',ci*cw).attr('y',ri*cellH).attr('width',cw-3).attr('height',cellH-3).attr('fill',fill).attr('rx',8);g.append('text').attr('x',ci*cw+cw/2).attr('y',ri*cellH+cellH/2).attr('text-anchor','middle').attr('dominant-baseline','middle').attr('font-size',10).attr('font-weight','600').attr('fill',n>.55?'white':cols[ri]).text(val.toFixed(1));});}); labels.forEach((_,ci)=>{g.append('text').attr('x',ci*cw+cw/2).attr('y',clusters.length*cellH+20).attr('text-anchor','middle').attr('font-size',11).attr('fill',C.muted).attr('font-weight','600').text(labels[ci]);}); },
    explain: {
      que: 'Mapa de calor donde cada celda muestra el valor promedio de una variable para cada cluster, normalizado entre 0 y 1 para comparación visual.',
      hallazgo: 'Cluster 0 (azul) muestra valores más altos en edad y experiencia laboral. Cluster 1 (naranja) tiene mayor % de ingreso destinado al préstamo. La separación es clara en variables demográficas pero no en variables de riesgo.',
      stats: [
        {l:'C0 edad media', v:`${D.clusters[0]?.person_age?.toFixed(1)} años`},
        {l:'C0 exp. media', v:`${D.clusters[0]?.person_emp_exp?.toFixed(1)} años`},
        {l:'C1 edad media', v:`${D.clusters[1]?.person_age?.toFixed(1)} años`},
        {l:'C1 exp. media', v:`${D.clusters[1]?.person_emp_exp?.toFixed(1)} años`},
      ],
      color: 'ins-green'
    }
  },
  g11: {
    title: 'Scorecard de métricas — comparación de 3 modelos',
    sub: 'AUC-ROC · Accuracy · F1-Score en test set',
    build: (el) => { el.innerHTML=''; const models=D.modelos,maxAuc=d3.max(models,m=>m.auc),cols=[C.orange,C.blue,C.green],best=models.reduce((a,b)=>a.auc>b.auc?a:b); const t=document.createElement('table');t.className='scorecard';t.style.fontSize='13px'; t.innerHTML=`<thead><tr><th>Modelo</th><th>AUC-ROC</th><th>Train Acc</th><th>Test Acc</th><th>F1-Rech.</th><th>F1-Aprov.</th><th></th></tr></thead><tbody>${models.map((m,i)=>{const cm=m.confusion_matrix,tn=cm[0][0],fp=cm[0][1],fn=cm[1][0],tp=cm[1][1],prR=tn/(tn+fn),reR=tn/(tn+fp),prA=tp/(tp+fp),reA=tp/(tp+fn),f1r=prR+reR>0?(2*prR*reR/(prR+reR)).toFixed(2):'—',f1a=prA+reA>0?(2*prA*reA/(prA+reA)).toFixed(2):'—';return`<tr><td class="sc-name" style="color:${cols[i]}">${m.nombre}</td><td><div class="bar-sc"><div class="bar-sc-bg"><div class="bar-sc-fill" style="width:${(m.auc/maxAuc)*100}%;background:${cols[i]}"></div></div><span class="sc-val" style="color:${cols[i]}">${m.auc}</span></div></td><td class="sc-val" style="color:${C.muted}">${m.train_acc.toFixed(1)}%</td><td class="sc-val" style="color:${cols[i]};font-size:14px">${m.test_acc.toFixed(1)}%</td><td class="sc-val" style="color:${C.muted}">${f1r}</td><td class="sc-val" style="color:${C.muted}">${f1a}</td><td>${m.nombre===best.nombre?'<span class="badge-best">MEJOR</span>':''}</td></tr>`;}).join('')}</tbody>`; el.appendChild(t); },
    explain: {
      que: 'Tabla comparativa de los 3 modelos evaluados con las métricas más relevantes sobre el conjunto de test (datos no vistos durante entrenamiento).',
      hallazgo: 'XGBoost lidera con AUC 0.9767 y Test Accuracy 92.6%. La Regresión Logística es competitiva (AUC 0.9529) con mucho menos costo computacional. Random Forest muestra la mayor brecha Train-Test, indicando overfitting moderado.',
      stats: D.modelos.map(m=>({l:m.nombre+' AUC', v:String(m.auc)})),
      color: 'ins-green'
    }
  },
  g12: {
    title: 'Curvas ROC — comparación de los 3 modelos',
    sub: 'Trade-off TPR/FPR · diagonal = clasificador aleatorio (AUC 0.5)',
    build: (el) => { el.innerHTML=''; const models=D.modelos,cols=[C.orange,C.blue,C.green],dashes=['3 3','7 3',null],best=models.reduce((a,b)=>a.auc>b.auc?a:b); const Ww=el.offsetWidth||700,H=340,m={t:20,r:20,b:50,l:52},iw=Ww-m.l-m.r,ih=H-m.t-m.b; const svg=d3.select(el).append('svg').attr('width',Ww).attr('height',H),g=svg.append('g').attr('transform',`translate(${m.l},${m.t})`); const x=d3.scaleLinear().domain([0,1]).range([0,iw]),y=d3.scaleLinear().domain([0,1]).range([ih,0]); g.append('g').call(d3.axisLeft(y).ticks(5).tickFormat(d=>d.toFixed(1))).call(gy=>{gy.select('.domain').attr('stroke',C.border);gy.selectAll('text').attr('font-size',11).attr('fill',C.muted);gy.selectAll('line').attr('stroke',C.border).attr('stroke-dasharray','3 2');}); g.append('g').attr('transform',`translate(0,${ih})`).call(d3.axisBottom(x).ticks(5).tickFormat(d=>d.toFixed(1))).call(gx=>{gx.select('.domain').attr('stroke',C.border);gx.selectAll('text').attr('font-size',11).attr('fill',C.muted);}); g.append('line').attr('x1',0).attr('x2',iw).attr('y1',ih).attr('y2',0).attr('stroke',C.border).attr('stroke-width',1.5).attr('stroke-dasharray','5 4'); const line=d3.line().x(d=>x(d[0])).y(d=>y(d[1])).curve(d3.curveCatmullRom); models.forEach((m,i)=>{const pts=m.roc.fpr.map((f,j)=>[f,m.roc.tpr[j]]);if(m.nombre===best.nombre){g.append('path').datum(pts).attr('d',d3.area().x(d=>x(d[0])).y0(ih).y1(d=>y(d[1])).curve(d3.curveCatmullRom)).attr('fill',cols[i]).attr('opacity',.1);}g.append('path').datum(pts).attr('d',line).attr('fill','none').attr('stroke',cols[i]).attr('stroke-width',m.nombre===best.nombre?3:2).attr('stroke-dasharray',dashes[i]||null);}); const lg=g.append('g').attr('transform',`translate(${iw*.22},${ih*.06})`); models.forEach((m,i)=>{lg.append('line').attr('x1',0).attr('x2',24).attr('y1',i*22+7).attr('y2',i*22+7).attr('stroke',cols[i]).attr('stroke-width',m.nombre===best.nombre?3:2).attr('stroke-dasharray',dashes[i]||null);lg.append('text').attr('x',30).attr('y',i*22+12).attr('font-size',12).attr('fill',C.muted).attr('font-weight','700').text(`${m.nombre}  AUC ${m.auc}`);}); g.append('text').attr('transform','rotate(-90)').attr('x',-ih/2).attr('y',-38).attr('text-anchor','middle').attr('font-size',11).attr('fill',C.muted).text('Sensibilidad (TPR)'); g.append('text').attr('x',iw/2).attr('y',ih+40).attr('text-anchor','middle').attr('font-size',11).attr('fill',C.muted).text('1 − Especificidad (FPR)'); },
    explain: {
      que: 'La curva ROC grafica la Sensibilidad (verdaderos positivos) contra la Tasa de Falsos Positivos para todos los umbrales posibles. El área bajo la curva (AUC) resume el rendimiento.',
      hallazgo: 'Los 3 modelos superan ampliamente el azar (AUC > 0.95). XGBoost se aleja más de la diagonal con AUC 0.9767. La curva de XGBoost tiene mayor área sombreada, confirmando su superioridad.',
      stats: D.modelos.map(m=>({l:m.nombre, v:`AUC ${m.auc}`})),
      color: 'ins-green'
    }
  },
  g15: {
    title: 'Train vs Test Accuracy — análisis de overfitting',
    sub: 'Brecha entre entrenamiento y test por modelo',
    build: (el) => { el.innerHTML=''; const models=D.modelos,cols=[C.orange,C.blue,C.green]; const allAcc=[...models.map(m=>m.train_acc),...models.map(m=>m.test_acc)],Ww=el.offsetWidth||700,H=300,m={t:20,r:20,b:60,l:54},iw=Ww-m.l-m.r,ih=H-m.t-m.b; const svg=d3.select(el).append('svg').attr('width',Ww).attr('height',H),g=svg.append('g').attr('transform',`translate(${m.l},${m.t})`); const x0=d3.scaleBand().domain(models.map(m=>m.nombre)).range([0,iw]).padding(.3),x1=d3.scaleBand().domain(['train','test']).range([0,x0.bandwidth()]).padding(.08),y=d3.scaleLinear().domain([d3.min(allAcc)*.97,d3.max(allAcc)*1.02]).range([ih,0]); g.append('g').call(d3.axisLeft(y).ticks(5).tickFormat(d=>d.toFixed(0)+'%')).call(gy=>{gy.select('.domain').attr('stroke',C.border);gy.selectAll('text').attr('font-size',11).attr('fill',C.muted);gy.selectAll('line').attr('stroke',C.border).attr('stroke-dasharray','3 2');}); models.forEach((m,i)=>{[['train',m.train_acc,.55],['test',m.test_acc,1]].forEach(([key,val,op],ki)=>{g.append('rect').attr('x',x0(m.nombre)+x1(key)).attr('y',ih).attr('width',x1.bandwidth()).attr('height',0).attr('fill',cols[i]).attr('rx',6).attr('opacity',op).transition().delay(ki*80).duration(600).ease(d3.easeCubicOut).attr('y',y(val)).attr('height',ih-y(val));g.append('text').attr('x',x0(m.nombre)+x1(key)+x1.bandwidth()/2).attr('y',y(val)-6).attr('text-anchor','middle').attr('font-size',11).attr('font-weight','700').attr('fill','#111827').attr('opacity',0).text(val.toFixed(1)+'%').transition().delay(ki*80+550).duration(200).attr('opacity',1);});const gap=m.train_acc-m.test_acc,mx=x0(m.nombre)+x0.bandwidth()/2;g.append('line').attr('x1',mx).attr('x2',mx).attr('y1',y(m.train_acc)).attr('y2',y(m.test_acc)).attr('stroke',C.orange).attr('stroke-width',2).attr('stroke-dasharray','4 2').attr('opacity',.8);g.append('text').attr('x',mx+4).attr('y',(y(m.train_acc)+y(m.test_acc))/2).attr('dominant-baseline','middle').attr('font-size',11).attr('font-weight','700').attr('fill',C.orange2).text(`Δ${gap.toFixed(1)}%`);g.append('text').attr('x',x0(m.nombre)+x0.bandwidth()/2).attr('y',ih+20).attr('text-anchor','middle').attr('font-size',12).attr('fill',C.muted).attr('font-weight','700').text(m.nombre);}); g.append('g').attr('transform',`translate(0,${ih})`).call(d3.axisBottom(x0).tickSize(0).tickFormat('')).call(gx=>{gx.select('.domain').attr('stroke',C.border);}); },
    explain: {
      que: 'Comparación de accuracy en entrenamiento vs test para detectar overfitting (brecha grande = el modelo memoriza en vez de generalizar).',
      hallazgo: 'Regresión Logística generaliza mejor (Δ2.6%). Random Forest tiene la mayor brecha (Δ4.1%), señal de overfitting moderado. XGBoost equilibra bien alto rendimiento con buena generalización (Δ3.3%).',
      stats: D.modelos.map(m=>({l:m.nombre+' Δ', v:`${(m.train_acc-m.test_acc).toFixed(1)}%`})),
      color: 'ins-orange'
    }
  },
  g13: {
    title: 'Matriz de confusión — XGBoost (mejor modelo)',
    sub: 'TP · FP · FN · TN sobre el conjunto de test',
    build: (el) => { el.innerHTML=''; const best=D.modelos.reduce((a,b)=>a.auc>b.auc?a:b),cm=best.confusion_matrix,labels=['Rechazado','Aprobado'],totals=[cm[0].reduce((a,b)=>a+b),cm[1].reduce((a,b)=>a+b)],total=totals.reduce((a,b)=>a+b); const maxV=Math.max(...cm.flat()),Ww=el.offsetWidth||700,cellSz=Math.min((Ww-200)/2,160),H=cellSz*2+110,offX=(Ww-cellSz*2)/2,offY=54; const svg=d3.select(el).append('svg').attr('width',Ww).attr('height',H); cm.forEach((row,ri)=>row.forEach((val,ci)=>{const isOk=ri===ci,c=isOk?(ri===0?C.blue:C.green):C.orange,fill=isOk?d3.interpolate('#EEF0F7',c)(val/maxV):'#FEF4E6',xx=offX+ci*cellSz,yy=offY+ri*cellSz;svg.append('rect').attr('x',xx+3).attr('y',yy+3).attr('width',cellSz-7).attr('height',cellSz-7).attr('fill',fill).attr('rx',14).attr('stroke',c).attr('stroke-width',isOk?2:1.5);svg.append('text').attr('x',xx+cellSz/2).attr('y',yy+cellSz/2-12).attr('text-anchor','middle').attr('font-size',26).attr('font-weight','800').attr('fill',val>maxV*.55?'white':C.text).text(d3.format(',')(val));svg.append('text').attr('x',xx+cellSz/2).attr('y',yy+cellSz/2+12).attr('text-anchor','middle').attr('font-size',13).attr('font-weight','600').attr('fill',val>maxV*.55?'rgba(255,255,255,.8)':C.muted).text(`${(val/totals[ri]*100).toFixed(1)}%`);svg.append('text').attr('x',xx+cellSz/2).attr('y',yy+cellSz-14).attr('text-anchor','middle').attr('font-size',11).attr('fill',val>maxV*.55?'rgba(255,255,255,.6)':C.light).text(isOk?'✓ Correcto':'✗ Error');})); labels.forEach((lbl,i)=>{svg.append('text').attr('x',offX+i*cellSz+cellSz/2).attr('y',offY-16).attr('text-anchor','middle').attr('font-size',13).attr('fill',C.muted).attr('font-weight','700').text(lbl);svg.append('text').attr('x',offX-14).attr('y',offY+i*cellSz+cellSz/2).attr('text-anchor','end').attr('dominant-baseline','middle').attr('font-size',13).attr('fill',C.muted).attr('font-weight','700').text(lbl);}); svg.append('text').attr('x',offX+cellSz).attr('y',offY-32).attr('text-anchor','middle').attr('font-size',12).attr('fill',C.muted).attr('font-weight','700').text('Predicho →'); svg.append('text').attr('x',offX-52).attr('y',offY+cellSz).attr('text-anchor','middle').attr('font-size',12).attr('fill',C.muted).attr('font-weight','700').attr('transform',`rotate(-90,${offX-52},${offY+cellSz})`).text('Real →'); },
    explain: () => {
      const best=D.modelos.reduce((a,b)=>a.auc>b.auc?a:b);
      const cm=best.confusion_matrix,tn=cm[0][0],fp=cm[0][1],fn=cm[1][0],tp=cm[1][1];
      return {
        que: 'La matriz de confusión muestra los 4 tipos de predicción: Verdaderos Positivos (aprobados correctamente), Verdaderos Negativos, Falsos Positivos y Falsos Negativos.',
        hallazgo: `Los ${fn.toLocaleString('es-CO')} Falsos Negativos (aprobados reales predichos como rechazados) son el error de mayor costo para el negocio: representan clientes solventes que fueron rechazados incorrectamente.`,
        stats: [
          {l:'Verdaderos Negativos (TN)', v:tn.toLocaleString('es-CO')},
          {l:'Falsos Positivos (FP)', v:fp.toLocaleString('es-CO')},
          {l:'Falsos Negativos (FN)', v:fn.toLocaleString('es-CO')},
          {l:'Verdaderos Positivos (TP)', v:tp.toLocaleString('es-CO')},
        ],
        color: 'ins-blue'
      };
    }
  },
  g3cm: {
    title: 'Matrices de confusión — los 3 modelos',
    sub: 'Comparación lado a lado de errores de clasificación',
    build: (el) => { el.innerHTML=''; el.style.display='grid'; el.style.gridTemplateColumns='repeat(3,1fr)'; el.style.gap='.75rem'; build3CM(); const orig=document.getElementById('g3cm'); if(orig&&orig!==el){ el.innerHTML=orig.innerHTML; } },
    explain: {
      que: 'Tres matrices de confusión en paralelo permiten comparar visualmente cómo cada modelo distribuye sus errores.',
      hallazgo: 'XGBoost minimiza los Falsos Negativos (aprobados mal clasificados) respecto a los otros modelos. Regresión Logística tiene más FP. Para el negocio, preferir menos FN significa menos clientes solventes rechazados.',
      stats: D.modelos.map(m=>{const cm=m.confusion_matrix;return{l:m.nombre+' FN',v:cm[1][0].toLocaleString('es-CO')};}),
      color: 'ins-orange'
    }
  },
  gpr: {
    title: 'Curva Precision-Recall — XGBoost',
    sub: 'Trade-off entre precisión y sensibilidad según el umbral de decisión',
    build: (el) => { el.innerHTML=''; const best=D.modelos.reduce((a,b)=>a.auc>b.auc?a:b); const fpr=best.roc.fpr,tpr=best.roc.tpr; const cm=best.confusion_matrix,total_pos=cm[1].reduce((a,b)=>a+b),total_neg=cm[0].reduce((a,b)=>a+b),ratio=total_neg/total_pos; const prPts=tpr.map((t,i)=>{const f=fpr[i],prec=t===0&&f===0?1:t/(t+f*ratio+1e-9);return[t,Math.min(1,Math.max(0,prec))];}).filter(p=>p[0]>0).sort((a,b)=>a[0]-b[0]); const Ww=el.offsetWidth||700,H=320,m={t:20,r:20,b:50,l:54},iw=Ww-m.l-m.r,ih=H-m.t-m.b; const svg=d3.select(el).append('svg').attr('width',Ww).attr('height',H),g=svg.append('g').attr('transform',`translate(${m.l},${m.t})`); const x=d3.scaleLinear().domain([0,1]).range([0,iw]),y=d3.scaleLinear().domain([0,1]).range([ih,0]); g.append('g').call(d3.axisLeft(y).ticks(5).tickFormat(d=>d.toFixed(1))).call(gy=>{gy.select('.domain').attr('stroke',C.border);gy.selectAll('text').attr('font-size',11).attr('fill',C.muted);gy.selectAll('line').attr('stroke',C.border).attr('stroke-dasharray','3 2');}); g.append('g').attr('transform',`translate(0,${ih})`).call(d3.axisBottom(x).ticks(5).tickFormat(d=>d.toFixed(1))).call(gx=>{gx.select('.domain').attr('stroke',C.border);gx.selectAll('text').attr('font-size',11).attr('fill',C.muted);}); const basePrec=total_pos/(total_pos+total_neg); g.append('line').attr('x1',0).attr('x2',iw).attr('y1',y(basePrec)).attr('y2',y(basePrec)).attr('stroke',C.border).attr('stroke-width',1.5).attr('stroke-dasharray','5 4'); g.append('path').datum(prPts).attr('d',d3.line().x(d=>x(d[0])).y(d=>y(d[1])).curve(d3.curveCatmullRom)).attr('fill','none').attr('stroke',C.green).attr('stroke-width',2.5); g.append('path').datum(prPts).attr('d',d3.area().x(d=>x(d[0])).y0(ih).y1(d=>y(d[1])).curve(d3.curveCatmullRom)).attr('fill',C.green).attr('opacity',.08); g.append('text').attr('transform','rotate(-90)').attr('x',-ih/2).attr('y',-38).attr('text-anchor','middle').attr('font-size',11).attr('fill',C.muted).text('Precisión'); g.append('text').attr('x',iw/2).attr('y',ih+40).attr('text-anchor','middle').attr('font-size',11).attr('fill',C.muted).text('Recall (sensibilidad)'); },
    explain: {
      que: 'La curva Precision-Recall muestra el compromiso entre precisión (qué % de aprobados predichos son realmente aprobados) y recall (qué % de aprobados reales son detectados), variando el umbral de decisión.',
      hallazgo: 'Bajar el umbral por debajo de 0.5 aumenta el Recall (se aprueba más) pero reduce la Precisión (más falsos positivos). Para un banco, el umbral óptimo depende del costo relativo de rechazar un buen cliente vs aprobar uno malo.',
      stats: [
        {l:'Umbral por defecto', v:'0.5'},
        {l:'Proporción real aprobados', v:'22.3%'},
        {l:'Modelo', v:'XGBoost'},
      ],
      color: 'ins-green'
    }
  },
  g14a: {
    title: 'Feature Importance — Random Forest',
    sub: 'Importancia por reducción de impureza Gini · top variables',
    build: (el) => { el.innerHTML=''; buildFI2(el, D.feature_importance.random_forest, C.blue); },
    explain: () => {
      const top3 = D.feature_importance.random_forest.slice(-3).reverse();
      return {
        que: 'Mide cuánto reduce la impureza de Gini cada variable en los árboles del Random Forest. Valores más altos = mayor contribución a las decisiones.',
        hallazgo: `${top3[0]?.label} lidera en Random Forest con ${(top3[0]?.v*100).toFixed(1)}% de importancia. RF tiende a distribuir el peso entre más variables que XGBoost, lo que refleja su naturaleza de ensemble diverso.`,
        stats: top3.map(f=>({l:f.label, v:(f.v*100).toFixed(1)+'%'})),
        color: 'ins-blue'
      };
    }
  },
  g14b: {
    title: 'Feature Importance — XGBoost',
    sub: 'Importancia por ganancia de splits · top variables',
    build: (el) => { el.innerHTML=''; buildFI2(el, D.feature_importance.xgboost, C.green); },
    explain: () => {
      const top3 = D.feature_importance.xgboost.slice(-3).reverse();
      return {
        que: 'Mide la ganancia promedio de información que aporta cada variable en los splits de XGBoost. Variables con alta ganancia concentran mayor poder predictivo.',
        hallazgo: `${top3[0]?.label} domina en XGBoost con ${(top3[0]?.v*100).toFixed(1)}% de importancia. XGBoost es más concentrado que RF: pocas variables acaparan la mayoría del peso predictivo.`,
        stats: top3.map(f=>({l:f.label, v:(f.v*100).toFixed(1)+'%'})),
        color: 'ins-green'
      };
    }
  },
};

// Helper violin para modal (crea en el contenedor dado)
function violin2(container, tempId, dataA, dataR, domain, fmtFn){
  const div = document.createElement('div');
  div.id = tempId;
  container.appendChild(div);
  const Ww = container.offsetWidth || 600, H = 260, m = {t:28,r:20,b:40,l:60}, iw = Ww-m.l-m.r, ih = H-m.t-m.b;
  const svg = d3.select('#'+tempId).append('svg').attr('width',Ww).attr('height',H);
  const g = svg.append('g').attr('transform',`translate(${m.l},${m.t})`);
  const y = d3.scaleLinear().domain(domain).range([ih,0]);
  g.append('g').call(d3.axisLeft(y).ticks(5).tickFormat(fmtFn)).call(gy=>{gy.select('.domain').attr('stroke',C.border);gy.selectAll('text').attr('font-size',11).attr('fill',C.muted);gy.selectAll('line').attr('stroke',C.border).attr('stroke-dasharray','3 2');});
  function bs(arr){const s=[...arr].sort((a,b)=>a-b);const q1=d3.quantile(s,.25),q3=d3.quantile(s,.75),iqr=q3-q1;return{min:Math.max(d3.min(s),q1-1.5*iqr),q1,med:d3.median(s),q3,max:Math.min(d3.max(s),q3+1.5*iqr)};}
  function kde(k,thr,data){return thr.map(x=>[x,d3.mean(data,v=>k(x-v))]);}
  function ep(bw){return x=>Math.abs(x/=bw)<1?0.75*(1-x*x)/bw:0;}
  const thr=d3.range(domain[0],domain[1],(domain[1]-domain[0])/60);
  [{data:dataR,c:C.red,label:'Rechazados',cx:iw*.27},{data:dataA,c:C.green,label:'Aprobados',cx:iw*.73}].forEach(({data,c,label,cx})=>{
    const den=kde(ep((domain[1]-domain[0])/7),thr,data),mxD=d3.max(den,d=>d[1]),xs=d3.scaleLinear().domain([0,mxD]).range([0,iw*.22]);
    const area=d3.area().x0(d=>cx-xs(d[1])).x1(d=>cx+xs(d[1])).y(d=>y(d[0])).curve(d3.curveCatmullRom);
    g.append('path').datum(den).attr('d',area).attr('fill',c).attr('opacity',.18);
    g.append('path').datum(den).attr('d',d3.line().x(d=>cx+xs(d[1])).y(d=>y(d[0])).curve(d3.curveCatmullRom)).attr('fill','none').attr('stroke',c).attr('stroke-width',2).attr('opacity',.7);
    g.append('path').datum(den).attr('d',d3.line().x(d=>cx-xs(d[1])).y(d=>y(d[0])).curve(d3.curveCatmullRom)).attr('fill','none').attr('stroke',c).attr('stroke-width',2).attr('opacity',.7);
    const s=bs(data),bw=iw*.08;
    g.append('line').attr('x1',cx).attr('x2',cx).attr('y1',y(s.min)).attr('y2',y(s.max)).attr('stroke',c).attr('stroke-width',1.5);
    g.append('rect').attr('x',cx-bw).attr('y',y(s.q3)).attr('width',bw*2).attr('height',y(s.q1)-y(s.q3)).attr('fill','white').attr('stroke',c).attr('stroke-width',2).attr('rx',3);
    g.append('line').attr('x1',cx-bw).attr('x2',cx+bw).attr('y1',y(s.med)).attr('y2',y(s.med)).attr('stroke',c).attr('stroke-width',3);
    g.append('text').attr('x',cx).attr('y',y(s.med)-10).attr('text-anchor','middle').attr('font-size',12).attr('font-weight','600').attr('fill','#111827').text(fmtFn(s.med));
    g.append('text').attr('x',cx).attr('y',ih+24).attr('text-anchor','middle').attr('font-size',12).attr('fill',C.muted).attr('font-weight','600').text(label);
  });
}

// Helper feature importance para modal
function buildFI2(container, data, c){
  const sorted=[...data].sort((a,b)=>a.v-b.v);
  const div=document.createElement('div'); div.id='fi2tmp'+Math.random().toString(36).slice(2);
  container.appendChild(div);
  const Ww=container.offsetWidth||600,H=280,m={t:10,r:70,b:20,l:180},iw=Ww-m.l-m.r,ih=H-m.t-m.b;
  const svg=d3.select('#'+div.id).append('svg').attr('width',Ww).attr('height',H),g=svg.append('g').attr('transform',`translate(${m.l},${m.t})`);
  const x=d3.scaleLinear().domain([0,d3.max(sorted,d=>d.v)*1.15]).range([0,iw]),y=d3.scaleBand().domain(sorted.map(d=>d.label)).range([0,ih]).padding(.3);
  g.selectAll('.b').data(sorted).join('rect').attr('x',0).attr('y',d=>y(d.label)).attr('width',0).attr('height',y.bandwidth()).attr('fill',(d,i)=>d3.interpolate('#EEF0F7',c)(.3+i/sorted.length*.7)).attr('rx',6).transition().duration(600).ease(d3.easeCubicOut).attr('width',d=>x(d.v));
  g.selectAll('.v').data(sorted).join('text').attr('x',d=>x(d.v)+5).attr('y',d=>y(d.label)+y.bandwidth()/2).attr('dominant-baseline','middle').attr('font-size',12).attr('font-weight','700').attr('fill','#111827').attr('opacity',0).text(d=>(d.v*100).toFixed(1)+'%').transition().delay(550).duration(200).attr('opacity',1);
  g.append('g').call(d3.axisLeft(y).tickSize(0)).call(gy=>{gy.select('.domain').remove();gy.selectAll('text').attr('font-size',11).attr('fill',C.muted).attr('font-weight','600').attr('dx','-6');});
}

// ── Abrir / cerrar modal ──
function openModal(chartId){
  const meta = MODAL_META[chartId];
  if(!meta) return;

  const overlay   = document.getElementById('modal-overlay');
  const chartArea = document.getElementById('modal-chart-area');
  const explainEl = document.getElementById('modal-explain');

  // Resolver explain (puede ser función o objeto)
  const exp = typeof meta.explain === 'function' ? meta.explain() : meta.explain;

  // Título y subtítulo
  document.getElementById('modal-title').textContent = meta.title;
  document.getElementById('modal-sub').textContent   = meta.sub;

  // Limpiar áreas
  chartArea.innerHTML = '';
  explainEl.innerHTML = '';

  // Abrir overlay (para que el contenedor tenga dimensiones)
  overlay.classList.add('open');
  document.body.style.overflow = 'hidden';

  // Dibujar gráfica con pequeño delay para que el DOM esté pintado
  setTimeout(() => {
    meta.build(chartArea);
  }, 60);

  // Panel explicación
  explainEl.innerHTML = `
    <div class="modal-explain-section">
      <div class="modal-explain-label">¿Qué muestra esta gráfica?</div>
      <div class="modal-explain-text">${exp.que}</div>
    </div>
    <div class="modal-explain-section">
      <div class="modal-explain-label">Hallazgo principal</div>
      <div class="modal-explain-insight ${exp.color}">${exp.hallazgo}</div>
    </div>
    ${exp.stats && exp.stats.length ? `
    <div class="modal-explain-section">
      <div class="modal-explain-label">Datos clave</div>
      <div class="modal-stat-row">
        ${exp.stats.map(s=>`
          <div class="modal-stat">
            <span class="modal-stat-lbl">${s.l}</span>
            <span class="modal-stat-val">${s.v}</span>
          </div>`).join('')}
      </div>
    </div>` : ''}
  `;
}

function closeModal(){
  const overlay = document.getElementById('modal-overlay');
  overlay.classList.remove('open');
  document.body.style.overflow = '';
  setTimeout(() => {
    document.getElementById('modal-chart-area').innerHTML = '';
  }, 220);
}

// Listeners
document.getElementById('modal-close').addEventListener('click', closeModal);
document.getElementById('modal-overlay').addEventListener('click', (e) => {
  if(e.target === document.getElementById('modal-overlay')) closeModal();
});
document.addEventListener('keydown', (e) => {
  if(e.key === 'Escape') closeModal();
});
