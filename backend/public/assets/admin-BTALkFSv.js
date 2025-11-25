import{t as C,c as L,m as R,e as F,b as u,a as p,s as b,g as B,f as E}from"./format-CGZL2wRF.js";function z(d,e){const a=C(d);if(isNaN(e))return L(d,NaN);const t=a.getDate(),o=L(d,a.getTime());o.setMonth(a.getMonth()+e+1,0);const n=o.getDate();return t>=n?o:(a.setFullYear(o.getFullYear(),o.getMonth(),t),a)}function A(d){const e=C(d),a=e.getMonth();return e.setFullYear(e.getFullYear(),a+1,0),e.setHours(23,59,59,999),e}function H(d,e){const a=C(d.start),t=C(d.end);let o=+a>+t;const n=o?+a:+t,s=o?t:a;s.setHours(0,0,0,0);let r=1;const i=[];for(;+s<=n;)i.push(C(s)),s.setDate(s.getDate()+r),s.setHours(0,0,0,0);return o?i.reverse():i}function S(d){const e=C(d);return e.setDate(1),e.setHours(0,0,0,0),e}function _(d,e){const t=U(d);let o;if(t.date){const i=V(t.date,2);o=W(i.restDateString,i.year)}if(!o||isNaN(o.getTime()))return new Date(NaN);const n=o.getTime();let s=0,r;if(t.time&&(s=q(t.time),isNaN(s)))return new Date(NaN);if(t.timezone){if(r=Z(t.timezone),isNaN(r))return new Date(NaN)}else{const i=new Date(n+s),l=new Date(0);return l.setFullYear(i.getUTCFullYear(),i.getUTCMonth(),i.getUTCDate()),l.setHours(i.getUTCHours(),i.getUTCMinutes(),i.getUTCSeconds(),i.getUTCMilliseconds()),l}return new Date(n+s+r)}const M={dateTimeDelimiter:/[T ]/,timeZoneDelimiter:/[Z ]/i,timezone:/([Z+-].*)$/},O=/^-?(?:(\d{3})|(\d{2})(?:-?(\d{2}))?|W(\d{2})(?:-?(\d{1}))?|)$/,Y=/^(\d{2}(?:[.,]\d*)?)(?::?(\d{2}(?:[.,]\d*)?))?(?::?(\d{2}(?:[.,]\d*)?))?$/,j=/^([+-])(\d{2})(?::?(\d{2}))?$/;function U(d){const e={},a=d.split(M.dateTimeDelimiter);let t;if(a.length>2)return e;if(/:/.test(a[0])?t=a[0]:(e.date=a[0],t=a[1],M.timeZoneDelimiter.test(e.date)&&(e.date=d.split(M.timeZoneDelimiter)[0],t=d.substr(e.date.length,d.length))),t){const o=M.timezone.exec(t);o?(e.time=t.replace(o[1],""),e.timezone=o[1]):e.time=t}return e}function V(d,e){const a=new RegExp("^(?:(\\d{4}|[+-]\\d{"+(4+e)+"})|(\\d{2}|[+-]\\d{"+(2+e)+"})$)"),t=d.match(a);if(!t)return{year:NaN,restDateString:""};const o=t[1]?parseInt(t[1]):null,n=t[2]?parseInt(t[2]):null;return{year:n===null?o:n*100,restDateString:d.slice((t[1]||t[2]).length)}}function W(d,e){if(e===null)return new Date(NaN);const a=d.match(O);if(!a)return new Date(NaN);const t=!!a[4],o=w(a[1]),n=w(a[2])-1,s=w(a[3]),r=w(a[4]),i=w(a[5])-1;if(t)return K(e,r,i)?G(e,r,i):new Date(NaN);{const l=new Date(0);return!Q(e,n,s)||!X(e,o)?new Date(NaN):(l.setUTCFullYear(e,n,Math.max(o,s)),l)}}function w(d){return d?parseInt(d):1}function q(d){const e=d.match(Y);if(!e)return NaN;const a=x(e[1]),t=x(e[2]),o=x(e[3]);return ee(a,t,o)?a*R+t*F+o*1e3:NaN}function x(d){return d&&parseFloat(d.replace(",","."))||0}function Z(d){if(d==="Z")return 0;const e=d.match(j);if(!e)return 0;const a=e[1]==="+"?-1:1,t=parseInt(e[2]),o=e[3]&&parseInt(e[3])||0;return te(t,o)?a*(t*R+o*F):NaN}function G(d,e,a){const t=new Date(0);t.setUTCFullYear(d,0,4);const o=t.getUTCDay()||7,n=(e-1)*7+a+1-o;return t.setUTCDate(t.getUTCDate()+n),t}const J=[31,null,31,30,31,30,31,31,30,31,30,31];function N(d){return d%400===0||d%4===0&&d%100!==0}function Q(d,e,a){return e>=0&&e<=11&&a>=1&&a<=(J[e]||(N(d)?29:28))}function X(d,e){return e>=1&&e<=(N(d)?366:365)}function K(d,e,a){return e>=1&&e<=53&&a>=0&&a<=6}function ee(d,e,a){return d===24?e===0&&a===0:a>=0&&a<60&&e>=0&&e<60&&d>=0&&d<25}function te(d,e){return e>=0&&e<=59}function ae(d,e){return z(d,-1)}class ne{constructor(){this.charts={revenue:null,status:null,services:null,hourly:null},this.currentPeriod={startDate:null,endDate:null},this.initializeEventListeners(),this.setCurrentMonthPeriod()}initializeEventListeners(){const e=document.getElementById("setCurrentMonthBtn"),a=document.getElementById("setLastMonthBtn"),t=document.getElementById("generateReportBtn"),o=document.getElementById("exportReportPDF");e&&e.addEventListener("click",()=>this.setCurrentMonthPeriod()),a&&a.addEventListener("click",()=>this.setLastMonthPeriod()),t&&t.addEventListener("click",()=>this.generateReport()),o&&o.addEventListener("click",()=>this.exportToPDF())}setCurrentMonthPeriod(){const e=new Date,a=S(e),t=A(e);this.setPeriod(a,t)}setLastMonthPeriod(){const e=ae(new Date),a=S(e),t=A(e);this.setPeriod(a,t)}setPeriod(e,a){const t=document.getElementById("reportStartDate"),o=document.getElementById("reportEndDate");t&&(t.value=u(e,"yyyy-MM-dd")),o&&(o.value=u(a,"yyyy-MM-dd")),this.currentPeriod={startDate:u(e,"yyyy-MM-dd"),endDate:u(a,"yyyy-MM-dd")}}async generateReport(){const e=document.getElementById("reportStartDate"),a=document.getElementById("reportEndDate");if(!(e!=null&&e.value)||!(a!=null&&a.value)){alert("Por favor, selecione as datas de início e fim do período.");return}this.currentPeriod={startDate:e.value,endDate:a.value};const t=document.getElementById("reportContent");t&&t.classList.add("loading");try{const o=await this.fetchReportData();this.updateStatsCards(o),this.generateCharts(o),this.updateTopServicesTable(o)}catch(o){console.error("Erro ao gerar relatório:",o),alert("Erro ao gerar relatório. Tente novamente.")}finally{t&&t.classList.remove("loading")}}async fetchReportData(){const{startDate:e,endDate:a}=this.currentPeriod,t=await p.get(`/agendamentos?data_inicio=${e}&data_fim=${a}`),o=Array.isArray(t==null?void 0:t.agendamentos)?t.agendamentos:Array.isArray(t)?t:[],n=await p.get(`/agendamentos/stats?data_inicio=${e}&data_fim=${a}`);return console.log("📊 Dados do relatório:",{appointments:o.length,stats:n}),{appointments:o,stats:n||{},period:{startDate:e,endDate:a}}}updateStatsCards(e){const{appointments:a,stats:t}=e,o=Array.isArray(a)?a:[],n=o.length,s=document.getElementById("reportTotalAppointments");s&&(s.textContent=n);const r=o.reduce((v,I)=>{const $=parseFloat(I.preco)||0;return v+$/100},0),i=document.getElementById("reportTotalRevenue");i&&(i.textContent=`R$ ${r.toFixed(2)}`);const l=new Set(o.map(v=>v.cliente_cpf||v.cliente_id)).size,c=document.getElementById("reportNewClients");c&&(c.textContent=l);const m=o.filter(v=>v.status==="confirmado"||v.status==="realizado").length,g=n>0?(m/n*100).toFixed(1):"0",h=document.getElementById("reportConfirmationRate");h&&(h.textContent=`${g}%`),this.updateChangeIndicators(e)}updateChangeIndicators(e){[{id:"reportAppointmentsChange",value:"+12.5%",type:"positive"},{id:"reportRevenueChange",value:"+8.3%",type:"positive"},{id:"reportClientsChange",value:"+15.2%",type:"positive"},{id:"reportConfirmationChange",value:"-2.1%",type:"negative"}].forEach(({id:t,value:o,type:n})=>{const s=document.getElementById(t);s&&(s.textContent=o,s.className=`stat-change ${n}`)})}generateCharts(e){this.generateRevenueChart(e),this.generateStatusChart(e),this.generateServicesChart(e),this.generateHourlyChart(e)}generateRevenueChart(e){const a=document.getElementById("reportRevenueChart");if(!a)return;this.charts.revenue&&this.charts.revenue.destroy();const{appointments:t,period:o}=e,{startDate:n,endDate:s}=o,r=Array.isArray(t)?t:[],i=H({start:_(n),end:_(s)}),l=i.map(m=>u(m,"dd/MM")),c=i.map(m=>{const g=u(m,"yyyy-MM-dd");return r.filter(h=>h.data_agendamento===g).reduce((h,v)=>{const I=parseFloat(v.preco)||0;return h+I/100},0)});this.charts.revenue=new Chart(a,{type:"line",data:{labels:l,datasets:[{label:"Receita Diária (R$)",data:c,borderColor:"#ed6a2b",backgroundColor:"rgba(237, 106, 43, 0.1)",borderWidth:3,tension:.4,fill:!0,pointRadius:4,pointHoverRadius:6,pointBackgroundColor:"#ed6a2b",pointBorderColor:"#fff",pointBorderWidth:2}]},options:{responsive:!0,maintainAspectRatio:!1,plugins:{legend:{display:!0,position:"top",labels:{padding:20,font:{size:12,weight:"600"}}},tooltip:{backgroundColor:"rgba(0, 0, 0, 0.8)",padding:12,titleFont:{size:14,weight:"bold"},bodyFont:{size:13},callbacks:{label:m=>`Receita: R$ ${m.parsed.y.toFixed(2)}`}}},scales:{y:{beginAtZero:!0,ticks:{callback:m=>`R$ ${m}`},grid:{color:"rgba(0, 0, 0, 0.05)"}},x:{grid:{display:!1}}}}})}generateStatusChart(e){const a=document.getElementById("reportStatusChart");if(!a)return;this.charts.status&&this.charts.status.destroy();const{appointments:t}=e,o=Array.isArray(t)?t:[],n={pendente:0,confirmado:0,realizado:0,cancelado:0};o.forEach(s=>{n.hasOwnProperty(s.status)&&n[s.status]++}),this.charts.status=new Chart(a,{type:"doughnut",data:{labels:["Pendentes","Confirmados","Realizados","Cancelados"],datasets:[{data:[n.pendente,n.confirmado,n.realizado,n.cancelado],backgroundColor:["#fbbf24","#3b82f6","#22c55e","#ef4444"],borderWidth:3,borderColor:"#fff"}]},options:{responsive:!0,maintainAspectRatio:!1,plugins:{legend:{position:"right",labels:{padding:15,font:{size:12,weight:"600"},generateLabels:s=>{const r=s.data;return r.labels.length&&r.datasets.length?r.labels.map((i,l)=>{const c=r.datasets[0].data[l],m=r.datasets[0].data.reduce((h,v)=>h+v,0),g=m>0?(c/m*100).toFixed(1):"0";return{text:`${i}: ${c} (${g}%)`,fillStyle:r.datasets[0].backgroundColor[l],hidden:!1,index:l}}):[]}}},tooltip:{backgroundColor:"rgba(0, 0, 0, 0.8)",padding:12,callbacks:{label:s=>{const r=s.label||"",i=s.parsed,l=s.dataset.data.reduce((m,g)=>m+g,0),c=(i/l*100).toFixed(1);return`${r}: ${i} (${c}%)`}}}}}})}generateServicesChart(e){const a=document.getElementById("reportServicesChart");if(!a)return;this.charts.services&&this.charts.services.destroy();const{appointments:t}=e,o=Array.isArray(t)?t:[],n={};o.forEach(c=>{const m=c.tipo_vistoria||"Não especificado";n[m]=(n[m]||0)+1});const s=Object.keys(n),r=Object.values(n),i={cautelar:"#8b5cf6",transferencia:"#06b6d4",outros:"#f59e0b"},l=s.map(c=>i[c]||"#94a3b8");this.charts.services=new Chart(a,{type:"bar",data:{labels:s.map(c=>c.charAt(0).toUpperCase()+c.slice(1)),datasets:[{label:"Quantidade",data:r,backgroundColor:l,borderRadius:8,borderWidth:0}]},options:{responsive:!0,maintainAspectRatio:!1,plugins:{legend:{display:!1},tooltip:{backgroundColor:"rgba(0, 0, 0, 0.8)",padding:12}},scales:{y:{beginAtZero:!0,ticks:{stepSize:1},grid:{color:"rgba(0, 0, 0, 0.05)"}},x:{grid:{display:!1}}}}})}generateHourlyChart(e){const a=document.getElementById("reportHourlyChart");if(!a)return;this.charts.hourly&&this.charts.hourly.destroy();const{appointments:t}=e,o=Array.isArray(t)?t:[],n=Array(24).fill(0);o.forEach(i=>{if(i.horario_agendamento){const l=parseInt(i.horario_agendamento.split(":")[0]);l>=0&&l<24&&n[l]++}});const s=[],r=[];n.forEach((i,l)=>{i>0&&(s.push(`${l.toString().padStart(2,"0")}:00`),r.push(i))}),this.charts.hourly=new Chart(a,{type:"bar",data:{labels:s,datasets:[{label:"Agendamentos",data:r,backgroundColor:"rgba(34, 197, 94, 0.7)",borderColor:"#22c55e",borderWidth:2,borderRadius:8}]},options:{responsive:!0,maintainAspectRatio:!1,plugins:{legend:{display:!1},tooltip:{backgroundColor:"rgba(0, 0, 0, 0.8)",padding:12}},scales:{y:{beginAtZero:!0,ticks:{stepSize:1},grid:{color:"rgba(0, 0, 0, 0.05)"}},x:{grid:{display:!1}}}}})}updateTopServicesTable(e){const a=document.getElementById("topServicesTable");if(!a)return;const{appointments:t}=e,o=Array.isArray(t)?t:[],n={};o.forEach(r=>{const i=r.tipo_vistoria||"Não especificado";n[i]||(n[i]={count:0,revenue:0}),n[i].count++;const l=parseFloat(r.preco)||0;n[i].revenue+=l/100});const s=Object.entries(n).sort((r,i)=>i[1].count-r[1].count).slice(0,5);if(s.length===0){a.innerHTML=`
        <tr>
          <td colspan="5" style="text-align: center; padding: 40px; color: #666;">
            Nenhum dado disponível para o período selecionado
          </td>
        </tr>
      `;return}a.innerHTML=s.map(([r,i],l)=>{const c=i.count>0?i.revenue/i.count:0;return`
        <tr>
          <td>${["🥇","🥈","🥉"][l]||""} ${l+1}º</td>
          <td>${r.charAt(0).toUpperCase()+r.slice(1)}</td>
          <td>${i.count}</td>
          <td>R$ ${i.revenue.toFixed(2)}</td>
          <td>R$ ${c.toFixed(2)}</td>
        </tr>
      `}).join("")}async exportToPDF(){if(!this.currentPeriod.startDate||!this.currentPeriod.endDate){alert("Por favor, gere um relatório antes de exportar.");return}const e=document.getElementById("reportContent");if(e)try{const a=await html2canvas(e,{scale:2,backgroundColor:"#f8fafc",logging:!1,windowWidth:1920,windowHeight:e.scrollHeight}),{jsPDF:t}=window.jspdf,o=new t("l","mm","a4"),n=a.toDataURL("image/png"),s=280,r=a.height*s/a.width;let i=r,l=10;for(o.addImage(n,"PNG",10,l,s,r),i-=190;i>=0;)l=i-r+10,o.addPage(),o.addImage(n,"PNG",10,l,s,r),i-=190;const c=`relatorio-${this.currentPeriod.startDate}-${this.currentPeriod.endDate}.pdf`;o.save(c)}catch(a){console.error("Erro ao exportar PDF:",a),alert("Erro ao exportar relatório. Tente novamente.")}}destroy(){Object.values(this.charts).forEach(e=>{e&&e.destroy()})}}class k{constructor(){this.empresas=[],this.empresaSelecionada=null,this.init()}async init(){await this.loadEmpresas(),this.attachEventListeners()}async loadEmpresas(){var e;try{const a=localStorage.getItem("token");console.log("🔐 Token presente:",!!a),console.log("🔗 Fazendo request para:",`${b.API_URL}/admin/empresas`);const t=await fetch(`${b.API_URL}/admin/empresas`,{headers:{Authorization:`Bearer ${a}`}});if(console.log("📡 Response status:",t.status),!t.ok){const o=await t.json().catch(()=>({}));if(console.error("❌ Erro da API:",o),t.status===500||(e=o.error)!=null&&e.includes("empresas")){console.warn("⚠️ Funcionalidade de empresas não disponível. Ignorando..."),this.empresas=[],this.renderLista();return}throw new Error(o.error||"Erro ao carregar empresas")}this.empresas=await t.json(),console.log("✅ Empresas carregadas:",this.empresas.length),this.renderLista()}catch(a){console.error("❌ Erro ao carregar empresas:",a),a.message.includes("não disponível")||console.warn("⚠️ Não foi possível carregar empresas. A funcionalidade pode não estar ativa.")}}renderLista(){const e=document.getElementById("empresasTableBody");if(!e){console.error("Elemento empresasTableBody não encontrado");return}if(this.empresas.length===0){e.innerHTML=`
        <tr>
          <td colspan="8" style="text-align: center; padding: 40px; color: #666;">
            <p style="font-size: 1.1em; margin-bottom: 10px;">📭 Nenhuma empresa cadastrada ainda</p>
            <p style="font-size: 0.9em;">Clique em "+ Nova Empresa" para começar</p>
          </td>
        </tr>
      `;return}e.innerHTML=this.empresas.map(a=>{var r,i;const t={ativo:"success",inativo:"secondary",suspenso:"danger",trial:"warning"}[a.status]||"secondary",o=Math.floor((new Date-new Date(a.data_inicio))/(1e3*60*60*24)),n=o<=30,s=n?30-o:0;return`
        <tr>
          <td>
            <strong>${a.nome}</strong><br>
            <small style="color: #666;">${a.slug}.agendaaquivistorias.com.br</small>
          </td>
          <td>${a.email}</td>
          <td>${a.telefone||"-"}</td>
          <td>
            <small style="color: #666;">${a.chave_pix}</small>
          </td>
          <td>
            ${n?`<span class="badge badge-warning">R$ 5,00 (${s}d)</span>`:'<span class="badge badge-success">R$ 0,00</span>'}
          </td>
          <td>
            <span class="badge badge-${t}">${a.status}</span>
          </td>
          <td>
            <strong>${((r=a.metricas)==null?void 0:r.total_agendamentos)||0}</strong> agendamentos<br>
            <small style="color: #666;">R$ ${((((i=a.metricas)==null?void 0:i.total_receita)||0)/100).toFixed(2)}</small>
          </td>
          <td>
            <div class="btn-group">
              <button class="btn btn-sm btn-secondary" onclick="empresasManager.visualizar(${a.id})" title="Visualizar">
                👁️
              </button>
              <button class="btn btn-sm btn-primary" onclick="empresasManager.editar(${a.id})" title="Editar">
                ✏️
              </button>
              <button class="btn btn-sm btn-danger" onclick="empresasManager.deletar(${a.id}, '${a.nome}')" title="Deletar">
                🗑️
              </button>
            </div>
          </td>
        </tr>
      `}).join("")}attachEventListeners(){const e=document.getElementById("btnNovaEmpresa");e&&e.addEventListener("click",()=>this.abrirModalNova());const a=document.getElementById("salvarEmpresa");a&&a.addEventListener("click",()=>this.salvar());const t=document.getElementById("fecharModalEmpresa");t&&t.addEventListener("click",()=>this.fecharModal());const o=document.getElementById("empresaNome"),n=document.getElementById("empresaSlug");o&&n&&o.addEventListener("input",s=>{const r=s.target.value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"");n.value=r})}abrirModalNova(){this.empresaSelecionada=null,document.getElementById("modalEmpresaTitle").textContent="Nova Empresa",document.getElementById("formEmpresa").reset(),document.getElementById("modalEmpresa").style.display="flex"}async visualizar(e){var a;try{const t=await fetch(`${b.API_URL}/admin/empresas/${e}`,{headers:{Authorization:`Bearer ${localStorage.getItem("token")}`}});if(!t.ok)throw new Error("Erro ao carregar empresa");const o=await t.json();alert(`
        Empresa: ${o.nome}
        Subdomínio: ${o.slug}.agendaaquivistorias.com.br
        Email: ${o.email}
        Status: ${o.status}
        PIX: ${o.chave_pix}

        Métricas últimos 6 meses:
        ${(a=o.metricas)==null?void 0:a.map(n=>`${n.mes}/${n.ano}: ${n.total_agendamentos||0} agendamentos, R$ ${((n.total_receita||0)/100).toFixed(2)}`).join(`
`)}
      `)}catch(t){console.error("Erro:",t),alert("Erro ao visualizar empresa")}}async editar(e){try{const a=await fetch(`${b.API_URL}/admin/empresas/${e}`,{headers:{Authorization:`Bearer ${localStorage.getItem("token")}`}});if(!a.ok)throw new Error("Erro ao carregar empresa");const t=await a.json();this.empresaSelecionada=t,document.getElementById("modalEmpresaTitle").textContent="Editar Empresa",document.getElementById("empresaNome").value=t.nome,document.getElementById("empresaSlug").value=t.slug,document.getElementById("empresaSlug").disabled=!0,document.getElementById("empresaEmail").value=t.email,document.getElementById("empresaTelefone").value=t.telefone||"",document.getElementById("empresaCNPJ").value=t.cnpj||"",document.getElementById("empresaChavePix").value=t.chave_pix,document.getElementById("empresaStatus").value=t.status,document.getElementById("empresaPlano").value=t.plano,document.getElementById("empresaPrecoCautelar").value=t.preco_cautelar/100,document.getElementById("empresaPrecoTransferencia").value=t.preco_transferencia/100,document.getElementById("empresaPrecoOutros").value=t.preco_outros/100,document.getElementById("empresaHorarioInicio").value=t.horario_inicio,document.getElementById("empresaHorarioFim").value=t.horario_fim,document.getElementById("modalEmpresa").style.display="flex"}catch(a){console.error("Erro:",a),alert("Erro ao carregar dados da empresa")}}async salvar(){const e={nome:document.getElementById("empresaNome").value,slug:document.getElementById("empresaSlug").value,email:document.getElementById("empresaEmail").value,telefone:document.getElementById("empresaTelefone").value,cnpj:document.getElementById("empresaCNPJ").value,chave_pix:document.getElementById("empresaChavePix").value,status:document.getElementById("empresaStatus").value,plano:document.getElementById("empresaPlano").value,preco_cautelar:Math.round(parseFloat(document.getElementById("empresaPrecoCautelar").value)*100),preco_transferencia:Math.round(parseFloat(document.getElementById("empresaPrecoTransferencia").value)*100),preco_outros:Math.round(parseFloat(document.getElementById("empresaPrecoOutros").value)*100),horario_inicio:document.getElementById("empresaHorarioInicio").value,horario_fim:document.getElementById("empresaHorarioFim").value};try{const a=this.empresaSelecionada?`${b.API_URL}/admin/empresas/${this.empresaSelecionada.id}`:`${b.API_URL}/admin/empresas`,t=this.empresaSelecionada?"PUT":"POST",o=await fetch(a,{method:t,headers:{"Content-Type":"application/json",Authorization:`Bearer ${localStorage.getItem("token")}`},body:JSON.stringify(e)}),n=await o.json();if(!o.ok)throw new Error(n.error||"Erro ao salvar empresa");alert(n.mensagem||"Empresa salva com sucesso!"),n.url&&alert(`Empresa disponível em:
${n.url}`),this.fecharModal(),await this.loadEmpresas()}catch(a){console.error("Erro:",a),alert(a.message)}}async deletar(e,a){if(confirm(`Tem certeza que deseja deletar a empresa "${a}"?

ISSO VAI DELETAR TODOS OS DADOS (agendamentos, clientes, etc.)!`)&&confirm("ÚLTIMA CONFIRMAÇÃO: Esta ação é IRREVERSÍVEL!"))try{const t=await fetch(`${b.API_URL}/admin/empresas/${e}`,{method:"DELETE",headers:{Authorization:`Bearer ${localStorage.getItem("token")}`}}),o=await t.json();if(!t.ok)throw new Error(o.error||"Erro ao deletar empresa");alert(o.mensagem||"Empresa deletada com sucesso"),await this.loadEmpresas()}catch(t){console.error("Erro:",t),alert(t.message)}}fecharModal(){document.getElementById("modalEmpresa").style.display="none",document.getElementById("empresaSlug").disabled=!1}}document.readyState==="loading"?document.addEventListener("DOMContentLoaded",()=>{document.getElementById("section-empresas")&&new k}):document.getElementById("section-empresas")&&new k;class oe{constructor(){this.currentFilters={},this.appointments=[],this.currentCalendarDate=new Date,this.reportsManager=null,this.empresasManager=null,this.init()}init(){B.isAuthenticated()?this.showDashboard():this.showLogin()}showLogin(){document.getElementById("loginScreen").style.display="flex",document.getElementById("adminDashboard").style.display="none",document.getElementById("loginForm").addEventListener("submit",async t=>{t.preventDefault(),await this.handleLogin()});const a=document.getElementById("demoLoginBtn");a&&a.addEventListener("click",async()=>{document.getElementById("loginEmail").value="admin@vistoria.com",document.getElementById("loginPassword").value="Admin123!@#",await this.handleLogin()})}async handleLogin(){const e=document.getElementById("loginEmail").value,a=document.getElementById("loginPassword").value,t=document.getElementById("loginError");try{await B.login(e,a),this.showDashboard()}catch{t.textContent="Credenciais inválidas",t.style.display="block"}}async showDashboard(){document.getElementById("loginScreen").style.display="none",document.getElementById("adminDashboard").style.display="flex";const e=B.getUser();document.getElementById("sidebarUserName").textContent=(e==null?void 0:e.nome)||"Admin",await this.loadStats(),await this.loadAppointments(),this.initCharts(),this.reportsManager=new ne,this.empresasManager=new k,this.setupEmpresasModal(),this.setupNavigation(),this.setupConfiguracoes(),document.getElementById("logoutBtn").addEventListener("click",()=>{B.logout(),location.reload()}),document.getElementById("filterBtn").addEventListener("click",()=>{this.applyFilters()}),document.getElementById("clearFilterBtn").addEventListener("click",()=>{this.clearFilters()});const a=document.getElementById("appointmentModal");document.querySelector(".close").addEventListener("click",()=>{a.style.display="none"}),window.addEventListener("click",o=>{o.target===a&&(a.style.display="none")}),this.setupNewAppointmentModal(),this.setupNewClienteModal(),this.setupNotifications()}setupNavigation(){const e=document.querySelectorAll(".nav-item"),a=document.querySelectorAll(".content-section"),t=document.getElementById("pageTitle");e.forEach(s=>{s.addEventListener("click",async r=>{r.preventDefault();const i=s.dataset.section;e.forEach(m=>m.classList.remove("active")),s.classList.add("active"),a.forEach(m=>m.classList.remove("active"));const l=document.getElementById(`section-${i}`);l&&l.classList.add("active");const c={dashboard:"Dashboard",agendamentos:"Agendamentos",clientes:"Clientes",calendario:"Calendário",relatorios:"Relatórios",configuracoes:"Configurações"};t.textContent=c[i]||"Dashboard",i==="agendamentos"?(console.log("Navigating to Agendamentos - reloading data..."),await this.loadAppointments()):i==="dashboard"?(console.log("Navigating to Dashboard - reloading data..."),await this.loadStats(),await this.loadAppointments()):i==="clientes"?(console.log("Navigating to Clientes - reloading data..."),await this.loadClientes()):i==="calendario"?(console.log("Navigating to Calendario - rendering calendar..."),await this.renderCalendar()):i==="configuracoes"&&(console.log("Navigating to Configuracoes - loading settings..."),await this.loadConfiguracoes())})});const o=document.getElementById("menuToggle"),n=document.querySelector(".sidebar");o&&n&&o.addEventListener("click",()=>{n.classList.toggle("active")})}async loadStats(){var e,a;try{console.log("📊 Loading stats...");const t=u(new Date,"yyyy-MM-dd"),o=u(new Date(new Date().getFullYear(),new Date().getMonth(),1),"yyyy-MM-dd"),n=u(new Date(new Date().getFullYear(),new Date().getMonth()+1,0),"yyyy-MM-dd");console.log("   Today:",t),console.log("   Month range:",o,"to",n);const[s,r]=await Promise.all([p.get(`/agendamentos?data=${t}`),p.get(`/agendamentos/stats?data_inicio=${o}&data_fim=${n}`)]);console.log("✅ Stats loaded:",{todayData:s,monthData:r}),document.getElementById("statToday").textContent=s.total||0,document.getElementById("statPending").textContent=r.pendentes||0,document.getElementById("statConfirmed").textContent=r.confirmados||0,document.getElementById("statRevenue").textContent=E.currency(r.receita_total||0),console.log("✅ Stats rendered to DOM")}catch(t){console.error("❌ Error loading stats:",t),console.error("   Error details:",(e=t.response)==null?void 0:e.data),console.error("   Error status:",(a=t.response)==null?void 0:a.status),document.getElementById("statToday").textContent="0",document.getElementById("statPending").textContent="0",document.getElementById("statConfirmed").textContent="0",document.getElementById("statRevenue").textContent="R$ 0,00"}}async loadAppointments(){var o,n,s;const e=document.getElementById("dashboardAppointmentsTable"),a=document.getElementById("agendamentosAppointmentsTable"),t=`
      <tr>
        <td colspan="8" style="text-align: center; padding: 40px;">
          <div class="spinner"></div>
          <p style="margin-top: 10px; color: #666;">Carregando agendamentos...</p>
        </td>
      </tr>
    `;try{e&&(e.innerHTML=t),a&&(a.innerHTML=t);const r=new URLSearchParams(this.currentFilters);console.log("📋 Loading appointments with params:",r.toString());const i=await p.get(`/agendamentos?${r.toString()}`);console.log("✅ Appointments loaded:",i),this.appointments=i.agendamentos||[];const l=i.total||this.appointments.length;console.log(`📊 Loaded ${this.appointments.length} appointments (total: ${l})`),this.renderAppointments()}catch(r){console.error("❌ Error loading appointments:",r),console.error("Error details:",(o=r.response)==null?void 0:o.data);const i=`
        <tr><td colspan="9" style="text-align: center; padding: 40px;">
          <div style="color: var(--status-danger);">
            <svg style="width: 48px; height: 48px; margin-bottom: 10px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            <p style="font-weight: 600; margin-bottom: 5px;">Erro ao carregar agendamentos</p>
            <p style="font-size: 0.9rem; color: #666;">${((s=(n=r.response)==null?void 0:n.data)==null?void 0:s.error)||r.message}</p>
            <button class="btn btn-primary" onclick="adminPanel.loadAppointments()" style="margin-top: 15px;">
              Tentar Novamente
            </button>
          </div>
        </td></tr>
      `;e&&(e.innerHTML=i),a&&(a.innerHTML=i)}}renderAppointments(){const e=document.getElementById("dashboardAppointmentsTable"),a=document.getElementById("agendamentosAppointmentsTable"),t=`
      <tr><td colspan="9" style="text-align: center; padding: 40px;">
        <div style="color: #666;">
          <svg style="width: 48px; height: 48px; margin-bottom: 10px; opacity: 0.5;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
            <line x1="16" y1="2" x2="16" y2="6"></line>
            <line x1="8" y1="2" x2="8" y2="6"></line>
            <line x1="3" y1="10" x2="21" y2="10"></line>
          </svg>
          <p style="font-weight: 600; margin-bottom: 5px;">Nenhum agendamento encontrado</p>
          <p style="font-size: 0.9rem;">Use os filtros acima ou crie um novo agendamento</p>
        </div>
      </td></tr>
    `;if(!this.appointments||this.appointments.length===0){e&&(e.innerHTML=t),a&&(a.innerHTML=t);return}console.log(`🎨 Rendering ${this.appointments.length} appointments`);try{const o=this.appointments.map(n=>{const s=n.data.includes("T")?n.data.split("T")[0]:n.data,[r,i,l]=s.split("-").map(Number),c=new Date(r,i-1,l);return`
      <tr>
        <td><strong>${n.protocolo}</strong></td>
        <td>
          ${n.cliente_nome}<br>
          <small style="color: #666;">${n.cliente_telefone||"N/A"}</small>
        </td>
        <td>
          ${n.veiculo_marca} ${n.veiculo_modelo}<br>
          <small style="color: #666;">${n.veiculo_placa}</small>
        </td>
        <td>
          ${u(c,"dd/MM/yyyy")}<br>
          <small style="color: #666;">${n.horario}</small>
        </td>
        <td>${this.getTipoLabel(n.tipo_vistoria)}</td>
        <td>${E.currency(n.preco)}</td>
        <td>
          <span class="status-badge ${n.status}">${this.getStatusLabel(n.status)}</span>
        </td>
        <td>
          ${this.getPaymentStatusBadge(n)}
        </td>
        <td>
          <div class="action-buttons">
            <button class="btn btn-primary btn-small" onclick="adminPanel.viewDetails(${n.id})" title="Ver detalhes">
              <svg style="width: 16px; height: 16px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                <circle cx="12" cy="12" r="3"></circle>
              </svg>
            </button>
            <button class="btn btn-success btn-small" onclick="adminPanel.editAppointment(${n.id})" title="Editar">
              <svg style="width: 16px; height: 16px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
              </svg>
            </button>
            ${n.status!=="cancelado"&&n.status!=="realizado"?`
              <button class="btn btn-danger btn-small" onclick="adminPanel.deleteAppointment(${n.id})" title="Excluir">
                <svg style="width: 16px; height: 16px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="3 6 5 6 21 6"></polyline>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                </svg>
              </button>
            `:""}
          </div>
        </td>
      </tr>
    `}).join("");e&&(e.innerHTML=o),a&&(a.innerHTML=o),console.log("✅ Table rendered successfully in both Dashboard and Agendamentos sections")}catch(o){console.error("❌ Render error:",o);const n=`
        <tr><td colspan="9" style="text-align: center; padding: 40px;">
          <div style="color: var(--status-danger);">
            <p style="font-weight: 600; margin-bottom: 5px;">Erro ao renderizar agendamentos</p>
            <p style="font-size: 0.9rem; color: #666;">${o.message}</p>
            <button class="btn btn-primary" onclick="adminPanel.loadAppointments()" style="margin-top: 15px;">
              Tentar Novamente
            </button>
          </div>
        </td></tr>
      `;e&&(e.innerHTML=n),a&&(a.innerHTML=n)}}async viewDetails(e){try{const t=(await p.get(`/agendamentos/${e}`)).data,o=document.getElementById("appointmentModal"),n=document.getElementById("appointmentDetails");n.innerHTML=`
        <h2>Detalhes do Agendamento</h2>

        <div class="detail-section">
          <h3>Informações Gerais</h3>
          <div class="detail-row">
            <span class="detail-label">Protocolo:</span>
            <span class="detail-value"><strong>${t.protocolo}</strong></span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Status:</span>
            <span class="detail-value">
              <span class="status-badge ${t.status}">${this.getStatusLabel(t.status)}</span>
            </span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Data de Criação:</span>
            <span class="detail-value">${(()=>{try{return u(new Date(t.created_at),"dd/MM/yyyy HH:mm")}catch{return"Data inválida"}})()}</span>
          </div>
        </div>

        <div class="detail-section">
          <h3>Cliente</h3>
          <div class="detail-row">
            <span class="detail-label">Nome:</span>
            <span class="detail-value">${t.cliente_nome}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">CPF:</span>
            <span class="detail-value">${t.cliente_cpf}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Telefone:</span>
            <span class="detail-value">${t.cliente_telefone}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">E-mail:</span>
            <span class="detail-value">${t.cliente_email}</span>
          </div>
        </div>

        <div class="detail-section">
          <h3>Veículo</h3>
          <div class="detail-row">
            <span class="detail-label">Placa:</span>
            <span class="detail-value">${t.veiculo_placa}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Marca/Modelo:</span>
            <span class="detail-value">${t.veiculo_marca} ${t.veiculo_modelo}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Ano:</span>
            <span class="detail-value">${t.veiculo_ano}</span>
          </div>
        </div>

        <div class="detail-section">
          <h3>Agendamento</h3>
          <div class="detail-row">
            <span class="detail-label">Tipo:</span>
            <span class="detail-value">${this.getTipoLabel(t.tipo_vistoria)}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Data:</span>
            <span class="detail-value">${(()=>{try{const s=t.data.includes("T")?t.data.split("T")[0]:t.data,[r,i,l]=s.split("-").map(Number);return u(new Date(r,i-1,l),"dd/MM/yyyy")}catch{return"Data inválida"}})()}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Horário:</span>
            <span class="detail-value">${t.horario}</span>
          </div>
          ${t.endereco_vistoria?`
            <div class="detail-row">
              <span class="detail-label">Endereço:</span>
              <span class="detail-value">${t.endereco_vistoria}</span>
            </div>
          `:""}
          <div class="detail-row">
            <span class="detail-label">Valor:</span>
            <span class="detail-value"><strong>${E.currency(t.preco)}</strong></span>
          </div>
        </div>

        ${t.observacoes?`
          <div class="detail-section">
            <h3>Observações</h3>
            <p>${t.observacoes}</p>
          </div>
        `:""}

        <div style="margin-top: 30px; display: flex; gap: 10px; justify-content: center;">
          ${t.status==="pendente"?`
            <button class="btn btn-success" onclick="adminPanel.updateStatus(${t.id}, 'confirmado'); adminPanel.closeModal();">
              Confirmar
            </button>
          `:""}
          ${t.status==="confirmado"?`
            <button class="btn btn-primary" onclick="adminPanel.updateStatus(${t.id}, 'realizado'); adminPanel.closeModal();">
              Marcar como Realizado
            </button>
          `:""}
          ${t.status!=="cancelado"&&t.status!=="realizado"?`
            <button class="btn btn-danger" onclick="adminPanel.updateStatus(${t.id}, 'cancelado'); adminPanel.closeModal();">
              Cancelar
            </button>
          `:""}
          <button class="btn btn-secondary" onclick="adminPanel.closeModal()">Fechar</button>
        </div>
      `,o.style.display="block"}catch(a){console.error("Error loading appointment details:",a),alert("Erro ao carregar detalhes do agendamento")}}async updateStatus(e,a){if(confirm(`Confirmar alteração de status para "${this.getStatusLabel(a)}"?`))try{await p.patch(`/agendamentos/${e}/status`,{status:a}),await this.loadAppointments(),await this.loadStats(),alert("Status atualizado com sucesso!")}catch(t){console.error("Error updating status:",t),alert("Erro ao atualizar status")}}applyFilters(){const e=document.getElementById("filterDate").value,a=document.getElementById("filterStatus").value,t=document.getElementById("filterType").value;this.currentFilters={},e&&(this.currentFilters.data=e),a&&(this.currentFilters.status=a),t&&(this.currentFilters.tipo_vistoria=t),this.loadAppointments()}clearFilters(){document.getElementById("filterDate").value="",document.getElementById("filterStatus").value="",document.getElementById("filterType").value="",this.currentFilters={},this.loadAppointments()}closeModal(){document.getElementById("appointmentModal").style.display="none"}getStatusLabel(e){return{pendente:"Pendente",confirmado:"Confirmado",realizado:"Realizado",cancelado:"Cancelado"}[e]||e}getTipoLabel(e){return{cautelar:"Cautelar",transferencia:"Transferência",outros:"Outros"}[e]||e}getPaymentStatusBadge(e){const a=e.pagamento_status,t=e.pagamento_confirmado;return a==="approved"||t===1?'<span class="payment-badge approved">✓ Pago</span>':a==="pending"?'<span class="payment-badge pending">⏱ Pendente</span>':a==="rejected"||a==="cancelled"?'<span class="payment-badge rejected">✗ Rejeitado</span>':'<span class="payment-badge none">− Sem Pagamento</span>'}setupNewAppointmentModal(){const e=document.getElementById("newAppointmentModal"),a=document.getElementById("btnNovoAgendamento"),t=document.getElementById("closeNewAppointment"),o=document.getElementById("cancelNewAppointment"),n=document.getElementById("newAppointmentForm"),s=document.getElementById("dataAgendamento");document.getElementById("horarioAgendamento"),a.addEventListener("click",()=>{e.style.display="block",this.resetNewAppointmentForm();const r=u(new Date,"yyyy-MM-dd");s.setAttribute("min",r)}),t.addEventListener("click",()=>{e.style.display="none"}),o.addEventListener("click",()=>{e.style.display="none"}),window.addEventListener("click",r=>{r.target===e&&(e.style.display="none")}),s.addEventListener("change",async()=>{await this.loadAvailableTimes(s.value)}),this.applyInputMasks(),n.addEventListener("submit",async r=>{r.preventDefault(),await this.handleNewAppointment()})}applyInputMasks(){const e=document.getElementById("clienteCPF"),a=document.getElementById("clienteTelefone"),t=document.getElementById("veiculoPlaca");e.addEventListener("input",o=>{let n=o.target.value.replace(/\D/g,"");n.length>11&&(n=n.slice(0,11)),n=n.replace(/(\d{3})(\d)/,"$1.$2"),n=n.replace(/(\d{3})(\d)/,"$1.$2"),n=n.replace(/(\d{3})(\d{1,2})$/,"$1-$2"),o.target.value=n}),a.addEventListener("input",o=>{let n=o.target.value.replace(/\D/g,"");n.length>11&&(n=n.slice(0,11)),n=n.replace(/^(\d{2})(\d)/,"($1) $2"),n=n.replace(/(\d{5})(\d)/,"$1-$2"),o.target.value=n}),t.addEventListener("input",o=>{o.target.value=o.target.value.toUpperCase()})}async loadAvailableTimes(e){const a=document.getElementById("horarioAgendamento");try{const o=(await p.get(`/availability/${e}`)).data.slots;a.innerHTML='<option value="">Selecione um horário...</option>',o.forEach(n=>{if(n.available){const s=document.createElement("option");s.value=n.time,s.textContent=`${n.time} (${n.available_slots} vaga${n.available_slots>1?"s":""} disponível)`,a.appendChild(s)}}),o.filter(n=>n.available).length===0&&(a.innerHTML='<option value="">Nenhum horário disponível nesta data</option>')}catch(t){console.error("Error loading available times:",t),a.innerHTML='<option value="">Erro ao carregar horários</option>'}}async handleNewAppointment(){var n,s,r,i;const e=document.getElementById("submitNewAppointment"),a=document.getElementById("submitText"),t=document.getElementById("submitLoading"),o=document.getElementById("newAppointmentError");a.style.display="none",t.style.display="inline-block",e.disabled=!0,o.style.display="none";try{const l={cliente:{nome:document.getElementById("clienteNome").value,cpf:document.getElementById("clienteCPF").value.replace(/\D/g,""),email:document.getElementById("clienteEmail").value,telefone:document.getElementById("clienteTelefone").value.replace(/\D/g,"")},veiculo:{placa:document.getElementById("veiculoPlaca").value,marca:document.getElementById("veiculoMarca").value,modelo:document.getElementById("veiculoModelo").value,ano:parseInt(document.getElementById("veiculoAno").value)},tipo_vistoria:document.getElementById("tipoVistoria").value,data:document.getElementById("dataAgendamento").value,horario:document.getElementById("horarioAgendamento").value,endereco_vistoria:document.getElementById("enderecoVistoria").value||null,observacoes:document.getElementById("observacoes").value||null},c=await p.post("/agendamentos",l);alert(`Agendamento criado com sucesso!
Protocolo: ${c.data.protocolo}`),document.getElementById("newAppointmentModal").style.display="none",this.resetNewAppointmentForm(),await this.loadAppointments(),await this.loadStats()}catch(l){console.error("Error creating appointment:",l);let c="Erro ao criar agendamento. Tente novamente.";(s=(n=l.response)==null?void 0:n.data)!=null&&s.error?c=l.response.data.error:(i=(r=l.response)==null?void 0:r.data)!=null&&i.errors&&(c=l.response.data.errors.map(m=>m.msg).join(", ")),o.textContent=c,o.style.display="block"}finally{a.style.display="inline",t.style.display="none",e.disabled=!1}}resetNewAppointmentForm(){document.getElementById("newAppointmentForm").reset(),document.getElementById("newAppointmentError").style.display="none",document.getElementById("horarioAgendamento").innerHTML='<option value="">Selecione primeiro a data...</option>'}async editAppointment(e){try{const t=(await p.get(`/agendamentos/${e}`)).data,o=document.getElementById("editAppointmentModal");o.style.display="block",document.getElementById("editAppointmentId").value=t.id,document.getElementById("editStatus").value=t.status,document.getElementById("editAgendamentoClienteNome").value=t.cliente_nome,document.getElementById("editAgendamentoClienteCPF").value=this.formatCPF(t.cliente_cpf),document.getElementById("editAgendamentoClienteEmail").value=t.cliente_email,document.getElementById("editAgendamentoClienteTelefone").value=this.formatTelefone(t.cliente_telefone),document.getElementById("editVeiculoPlaca").value=t.veiculo_placa,document.getElementById("editVeiculoMarca").value=t.veiculo_marca,document.getElementById("editVeiculoModelo").value=t.veiculo_modelo,document.getElementById("editVeiculoAno").value=t.veiculo_ano,document.getElementById("editTipoVistoria").value=t.tipo_vistoria,document.getElementById("editDataAgendamento").value=t.data,document.getElementById("editHorarioAgendamento").value=t.horario,document.getElementById("editPreco").value=(t.preco/100).toFixed(2),document.getElementById("editEnderecoVistoria").value=t.endereco_vistoria||"",document.getElementById("editObservacoes").value=t.observacoes||"",this.editModalSetup||(this.setupEditAppointmentModal(),this.editModalSetup=!0)}catch(a){console.error("Error loading appointment for edit:",a),alert("Erro ao carregar dados do agendamento")}}setupEditAppointmentModal(){const e=document.getElementById("editAppointmentModal"),a=document.getElementById("closeEditAppointment"),t=document.getElementById("cancelEditAppointment"),o=document.getElementById("editAppointmentForm");a.addEventListener("click",()=>{e.style.display="none"}),t.addEventListener("click",()=>{e.style.display="none"}),window.addEventListener("click",n=>{n.target===e&&(e.style.display="none")}),this.applyEditInputMasks(),o.addEventListener("submit",async n=>{n.preventDefault(),await this.handleEditAppointment()})}applyEditInputMasks(){const e=document.getElementById("editAgendamentoClienteCPF"),a=document.getElementById("editAgendamentoClienteTelefone"),t=document.getElementById("editVeiculoPlaca");e.addEventListener("input",o=>{let n=o.target.value.replace(/\D/g,"");n.length>11&&(n=n.slice(0,11)),n=n.replace(/(\d{3})(\d)/,"$1.$2"),n=n.replace(/(\d{3})(\d)/,"$1.$2"),n=n.replace(/(\d{3})(\d{1,2})$/,"$1-$2"),o.target.value=n}),a.addEventListener("input",o=>{let n=o.target.value.replace(/\D/g,"");n.length>11&&(n=n.slice(0,11)),n=n.replace(/^(\d{2})(\d)/,"($1) $2"),n=n.replace(/(\d{5})(\d)/,"$1-$2"),o.target.value=n}),t.addEventListener("input",o=>{o.target.value=o.target.value.toUpperCase()})}async handleEditAppointment(){var n,s,r,i;const e=document.getElementById("submitEditAppointment"),a=document.getElementById("editSubmitText"),t=document.getElementById("editSubmitLoading"),o=document.getElementById("editAppointmentError");a.style.display="none",t.style.display="inline-block",e.disabled=!0,o.style.display="none";try{const l=document.getElementById("editAppointmentId").value,c={status:document.getElementById("editStatus").value,cliente_nome:document.getElementById("editAgendamentoClienteNome").value,cliente_cpf:document.getElementById("editAgendamentoClienteCPF").value.replace(/\D/g,""),cliente_email:document.getElementById("editAgendamentoClienteEmail").value,cliente_telefone:document.getElementById("editAgendamentoClienteTelefone").value.replace(/\D/g,""),veiculo_placa:document.getElementById("editVeiculoPlaca").value,veiculo_marca:document.getElementById("editVeiculoMarca").value,veiculo_modelo:document.getElementById("editVeiculoModelo").value,veiculo_ano:parseInt(document.getElementById("editVeiculoAno").value),tipo_vistoria:document.getElementById("editTipoVistoria").value,data:document.getElementById("editDataAgendamento").value,horario:document.getElementById("editHorarioAgendamento").value,preco:Math.round(parseFloat(document.getElementById("editPreco").value)*100),endereco_vistoria:document.getElementById("editEnderecoVistoria").value||null,observacoes:document.getElementById("editObservacoes").value||null};await p.put(`/agendamentos/${l}`,c),alert("Agendamento atualizado com sucesso!"),document.getElementById("editAppointmentModal").style.display="none",await this.loadAppointments(),await this.loadStats()}catch(l){console.error("Error updating appointment:",l);let c="Erro ao atualizar agendamento. Tente novamente.";(s=(n=l.response)==null?void 0:n.data)!=null&&s.error?c=l.response.data.error:(i=(r=l.response)==null?void 0:r.data)!=null&&i.errors&&(c=l.response.data.errors.map(m=>m.msg).join(", ")),o.textContent=c,o.style.display="block"}finally{a.style.display="inline",t.style.display="none",e.disabled=!1}}async deleteAppointment(e){if(confirm("Tem certeza que deseja excluir este agendamento? Esta ação não pode ser desfeita."))try{await p.delete(`/agendamentos/${e}`),alert("Agendamento excluído com sucesso!"),await this.loadAppointments(),await this.loadStats()}catch(a){console.error("Error deleting appointment:",a),alert("Erro ao excluir agendamento")}}formatCPF(e){return e?e.replace(/\D/g,"").replace(/(\d{3})(\d{3})(\d{3})(\d{2})/,"$1.$2.$3-$4"):""}formatTelefone(e){if(!e)return"";const a=e.replace(/\D/g,"");return a.length===11?a.replace(/(\d{2})(\d{5})(\d{4})/,"($1) $2-$3"):a.length===10?a.replace(/(\d{2})(\d{4})(\d{4})/,"($1) $2-$3"):e}async loadClientes(){var t,o;const e=document.getElementById("clientesTable"),a=`
      <tr>
        <td colspan="6" style="text-align: center; padding: 40px;">
          <div class="spinner"></div>
          <p style="margin-top: 10px; color: #666;">Carregando clientes...</p>
        </td>
      </tr>
    `;try{e&&(e.innerHTML=a),console.log("📋 Loading clientes...");const n=await p.get("/clientes");console.log("✅ Clientes loaded:",n),this.clientes=n.clientes||[],console.log(`📊 Loaded ${this.clientes.length} clientes (total: ${n.total})`),this.renderClientes()}catch(n){console.error("❌ Error loading clientes:",n);const s=`
        <tr><td colspan="6" style="text-align: center; padding: 40px;">
          <div style="color: var(--status-danger);">
            <svg style="width: 48px; height: 48px; margin-bottom: 10px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            <p style="font-weight: 600; margin-bottom: 5px;">Erro ao carregar clientes</p>
            <p style="font-size: 0.9rem; color: #666;">${((o=(t=n.response)==null?void 0:t.data)==null?void 0:o.error)||n.message}</p>
            <button class="btn btn-primary" onclick="adminPanel.loadClientes()" style="margin-top: 15px;">
              Tentar Novamente
            </button>
          </div>
        </td></tr>
      `;e&&(e.innerHTML=s)}}renderClientes(){const e=document.getElementById("clientesTable"),a=`
      <tr><td colspan="6" style="text-align: center; padding: 40px;">
        <div style="color: #666;">
          <svg style="width: 48px; height: 48px; margin-bottom: 10px; opacity: 0.5;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
            <circle cx="9" cy="7" r="4"></circle>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
          </svg>
          <p style="font-weight: 600; margin-bottom: 5px;">Nenhum cliente encontrado</p>
          <p style="font-size: 0.9rem;">Clique em "Novo Cliente" para cadastrar</p>
        </div>
      </td></tr>
    `;if(!this.clientes||this.clientes.length===0){e&&(e.innerHTML=a);return}console.log(`🎨 Rendering ${this.clientes.length} clientes`);try{const t=this.clientes.map(o=>`
        <tr>
          <td><strong>${o.nome}</strong></td>
          <td>${this.formatCPF(o.cpf)}</td>
          <td>${this.formatTelefone(o.telefone)}</td>
          <td>${o.email||"-"}</td>
          <td>${u(new Date(o.created_at),"dd/MM/yyyy")}</td>
          <td>
            <div class="action-buttons">
              <button class="btn btn-success btn-small" onclick="adminPanel.editCliente(${o.id})" title="Editar">
                <svg style="width: 16px; height: 16px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                </svg>
              </button>
              <button class="btn btn-danger btn-small" onclick="adminPanel.deleteCliente(${o.id})" title="Excluir">
                <svg style="width: 16px; height: 16px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="3 6 5 6 21 6"></polyline>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                </svg>
              </button>
            </div>
          </td>
        </tr>
      `).join("");e&&(e.innerHTML=t),console.log("✅ Clientes table rendered successfully")}catch(t){console.error("❌ Render error:",t);const o=`
        <tr><td colspan="6" style="text-align: center; padding: 40px;">
          <div style="color: var(--status-danger);">
            <p style="font-weight: 600; margin-bottom: 5px;">Erro ao renderizar clientes</p>
            <p style="font-size: 0.9rem; color: #666;">${t.message}</p>
            <button class="btn btn-primary" onclick="adminPanel.loadClientes()" style="margin-top: 15px;">
              Tentar Novamente
            </button>
          </div>
        </td></tr>
      `;e&&(e.innerHTML=o)}}setupNewClienteModal(){const e=document.getElementById("newClienteModal"),a=document.getElementById("btnNovoCliente"),t=document.getElementById("closeNewCliente"),o=document.getElementById("cancelNewCliente"),n=document.getElementById("newClienteForm");a.addEventListener("click",()=>{e.style.display="block",this.resetNewClienteForm()}),t.addEventListener("click",()=>{e.style.display="none"}),o.addEventListener("click",()=>{e.style.display="none"}),window.addEventListener("click",s=>{s.target===e&&(e.style.display="none")}),this.applyClienteMasks("new"),n.addEventListener("submit",async s=>{s.preventDefault(),await this.handleNewCliente()})}applyClienteMasks(e){const a=document.getElementById(`${e}ClienteCPF`),t=document.getElementById(`${e}ClienteTelefone`);a.addEventListener("input",o=>{let n=o.target.value.replace(/\D/g,"");n.length>11&&(n=n.slice(0,11)),n=n.replace(/(\d{3})(\d)/,"$1.$2"),n=n.replace(/(\d{3})(\d)/,"$1.$2"),n=n.replace(/(\d{3})(\d{1,2})$/,"$1-$2"),o.target.value=n}),t.addEventListener("input",o=>{let n=o.target.value.replace(/\D/g,"");n.length>11&&(n=n.slice(0,11)),n=n.replace(/^(\d{2})(\d)/,"($1) $2"),n=n.replace(/(\d{5})(\d)/,"$1-$2"),o.target.value=n})}async handleNewCliente(){var n,s;const e=document.getElementById("submitNewCliente"),a=document.getElementById("newClienteSubmitText"),t=document.getElementById("newClienteSubmitLoading"),o=document.getElementById("newClienteError");a.style.display="none",t.style.display="inline-block",e.disabled=!0,o.style.display="none";try{const r={nome:document.getElementById("newClienteNome").value,cpf:document.getElementById("newClienteCPF").value.replace(/\D/g,""),telefone:document.getElementById("newClienteTelefone").value.replace(/\D/g,""),email:document.getElementById("newClienteEmail").value||null};await p.post("/clientes",r),alert("Cliente cadastrado com sucesso!"),document.getElementById("newClienteModal").style.display="none",this.resetNewClienteForm(),await this.loadClientes()}catch(r){console.error("Error creating cliente:",r);let i="Erro ao cadastrar cliente. Tente novamente.";(s=(n=r.response)==null?void 0:n.data)!=null&&s.error&&(i=r.response.data.error),o.textContent=i,o.style.display="block"}finally{a.style.display="inline",t.style.display="none",e.disabled=!1}}resetNewClienteForm(){document.getElementById("newClienteForm").reset(),document.getElementById("newClienteError").style.display="none"}async editCliente(e){try{const t=(await p.get(`/clientes/${e}`)).data,o=document.getElementById("editClienteModal");o.style.display="block",document.getElementById("editClienteId").value=t.id,document.getElementById("editClienteNome").value=t.nome,document.getElementById("editClienteCPF").value=this.formatCPF(t.cpf),document.getElementById("editClienteTelefone").value=this.formatTelefone(t.telefone),document.getElementById("editClienteEmail").value=t.email||"",this.editClienteModalSetup||(this.setupEditClienteModal(),this.editClienteModalSetup=!0)}catch(a){console.error("Error loading cliente for edit:",a),alert("Erro ao carregar dados do cliente")}}setupEditClienteModal(){const e=document.getElementById("editClienteModal"),a=document.getElementById("closeEditCliente"),t=document.getElementById("cancelEditCliente"),o=document.getElementById("editClienteForm");a.addEventListener("click",()=>{e.style.display="none"}),t.addEventListener("click",()=>{e.style.display="none"}),window.addEventListener("click",n=>{n.target===e&&(e.style.display="none")}),this.applyClienteMasks("edit"),o.addEventListener("submit",async n=>{n.preventDefault(),await this.handleEditCliente()})}async handleEditCliente(){var n,s;const e=document.getElementById("submitEditCliente"),a=document.getElementById("editClienteSubmitText"),t=document.getElementById("editClienteSubmitLoading"),o=document.getElementById("editClienteError");a.style.display="none",t.style.display="inline-block",e.disabled=!0,o.style.display="none";try{const r=document.getElementById("editClienteId").value,i={nome:document.getElementById("editClienteNome").value,telefone:document.getElementById("editClienteTelefone").value.replace(/\D/g,""),email:document.getElementById("editClienteEmail").value||null};await p.put(`/clientes/${r}`,i),alert("Cliente atualizado com sucesso!"),document.getElementById("editClienteModal").style.display="none",await this.loadClientes()}catch(r){console.error("Error updating cliente:",r);let i="Erro ao atualizar cliente. Tente novamente.";(s=(n=r.response)==null?void 0:n.data)!=null&&s.error&&(i=r.response.data.error),o.textContent=i,o.style.display="block"}finally{a.style.display="inline",t.style.display="none",e.disabled=!1}}async deleteCliente(e){if(confirm("Tem certeza que deseja excluir este cliente? Esta ação não pode ser desfeita."))try{await p.delete(`/clientes/${e}`),alert("Cliente excluído com sucesso!"),await this.loadClientes()}catch(a){console.error("Error deleting cliente:",a),alert("Erro ao excluir cliente")}}async loadConfiguracoes(){try{console.log("📋 Loading configuracoes...");const e=await p.get("/config");console.log("✅ Configuracoes loaded:",e);const a=e.horario_inicio||"08:00",t=e.horario_fim||"18:00";document.getElementById("horarioInicio").value=a,document.getElementById("horarioFim").value=t;const o=(parseInt(e.preco_cautelar||15e3)/100).toFixed(2),n=(parseInt(e.preco_transferencia||12e3)/100).toFixed(2),s=(parseInt(e.preco_outros||1e4)/100).toFixed(2);document.getElementById("precoCautelar").value=o,document.getElementById("precoTransferencia").value=n,document.getElementById("precoOutros").value=s;const r=e.notificacao_email_confirmacao==="true"||e.notificacao_email_confirmacao===!0,i=e.notificacao_lembrete_24h==="true"||e.notificacao_lembrete_24h===!0;document.getElementById("notifEmailConfirmacao").checked=r,document.getElementById("notifLembrete24h").checked=i,console.log("✅ Configuracoes preenchidas no formulário")}catch(e){console.error("❌ Error loading configuracoes:",e),alert("Erro ao carregar configurações")}}setupConfiguracoes(){const e=document.getElementById("btnSalvarHorarios");e&&e.addEventListener("click",()=>this.saveHorarios());const a=document.getElementById("btnSalvarPrecos");a&&a.addEventListener("click",()=>this.savePrecos());const t=document.getElementById("btnSalvarNotificacoes");t&&t.addEventListener("click",()=>this.saveNotificacoes())}async saveHorarios(){const e=document.getElementById("horarioInicio").value,a=document.getElementById("horarioFim").value;if(!e||!a){alert("Preencha todos os campos de horário");return}try{const t={horario_inicio:e,horario_fim:a};console.log("💾 Salvando horários:",t),await p.put("/config",t),alert("Horários salvos com sucesso!")}catch(t){console.error("❌ Error saving horarios:",t),alert("Erro ao salvar horários")}}async savePrecos(){const e=parseFloat(document.getElementById("precoCautelar").value),a=parseFloat(document.getElementById("precoTransferencia").value),t=parseFloat(document.getElementById("precoOutros").value);if(isNaN(e)||isNaN(a)||isNaN(t)){alert("Preencha todos os campos de preço com valores válidos");return}try{const o={preco_cautelar:Math.round(e*100).toString(),preco_transferencia:Math.round(a*100).toString(),preco_outros:Math.round(t*100).toString()};console.log("💾 Salvando preços:",o),await p.put("/config",o),alert("Preços salvos com sucesso!")}catch(o){console.error("❌ Error saving precos:",o),alert("Erro ao salvar preços")}}async saveNotificacoes(){const e=document.getElementById("notifEmailConfirmacao").checked,a=document.getElementById("notifLembrete24h").checked;try{const t={notificacao_email_confirmacao:e.toString(),notificacao_lembrete_24h:a.toString()};console.log("💾 Salvando notificações:",t),await p.put("/config",t),alert("Configurações de notificação salvadas com sucesso!")}catch(t){console.error("❌ Error saving notificacoes:",t),alert("Erro ao salvar configurações de notificação")}}async setupCalendar(){const e=document.getElementById("prevMonthBtn"),a=document.getElementById("nextMonthBtn");e&&a&&(e.addEventListener("click",()=>{this.currentCalendarDate.setMonth(this.currentCalendarDate.getMonth()-1),this.renderCalendar()}),a.addEventListener("click",()=>{this.currentCalendarDate.setMonth(this.currentCalendarDate.getMonth()+1),this.renderCalendar()}))}async renderCalendar(){this.calendarSetup||(await this.setupCalendar(),this.calendarSetup=!0);const e=new Date(this.currentCalendarDate.getFullYear(),this.currentCalendarDate.getMonth(),1),a=new Date(this.currentCalendarDate.getFullYear(),this.currentCalendarDate.getMonth()+1,0);try{console.log(`📅 Loading appointments for calendar: ${u(e,"yyyy-MM-dd")} to ${u(a,"yyyy-MM-dd")}`);const y=await p.get(`/agendamentos?data_inicio=${u(e,"yyyy-MM-dd")}&data_fim=${u(a,"yyyy-MM-dd")}`);this.appointments=y.agendamentos||[],console.log(`📅 Calendar loaded ${this.appointments.length} appointments`)}catch(y){console.error("Error loading appointments for calendar:",y),this.appointments=[]}const t=document.getElementById("currentMonthLabel"),o=["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];t.textContent=`${o[this.currentCalendarDate.getMonth()]} ${this.currentCalendarDate.getFullYear()}`;const n=document.getElementById("calendarGrid"),s=n.querySelectorAll(".calendar-day-header");n.innerHTML="",s.forEach(y=>n.appendChild(y));const r=this.currentCalendarDate.getFullYear(),i=this.currentCalendarDate.getMonth(),l=new Date(r,i,1),c=new Date(r,i+1,0),m=l.getDay(),g=c.getDate(),h=new Date(r,i,0).getDate(),v=m,$=Math.ceil((g+m)/7)*7-(g+m),T=new Date;T.setHours(0,0,0,0);for(let y=v-1;y>=0;y--){const f=h-y,D=this.createCalendarDay(f,!0,new Date(r,i-1,f));n.appendChild(D)}for(let y=1;y<=g;y++){const f=new Date(r,i,y);f.setHours(0,0,0,0);const D=f.getTime()===T.getTime(),P=this.createCalendarDay(y,!1,f,D);n.appendChild(P)}for(let y=1;y<=$;y++){const f=this.createCalendarDay(y,!0,new Date(r,i+1,y));n.appendChild(f)}}createCalendarDay(e,a,t,o=!1){const n=document.createElement("div");n.className="calendar-day",a&&n.classList.add("other-month"),o&&n.classList.add("today");const s=document.createElement("div");s.className="day-number",s.textContent=e,n.appendChild(s);const r=u(t,"yyyy-MM-dd"),i=this.appointments.filter(l=>(l.data.includes("T")?l.data.split("T")[0]:l.data)===r);if(i.length>0&&!a){if(n.classList.add("has-appointments"),i.length>3){const m=document.createElement("div");m.className="appointment-count",m.textContent=i.length,n.appendChild(m)}const l=document.createElement("div");l.className="day-appointments",i.slice(0,3).forEach(m=>{const g=document.createElement("div");g.className=`calendar-appointment ${m.status}`,g.textContent=`${m.horario} - ${m.cliente_nome.split(" ")[0]}`,g.title=`${m.horario} - ${m.cliente_nome}
${m.veiculo_placa} - ${this.getStatusLabel(m.status)}`,g.addEventListener("click",h=>{h.stopPropagation(),this.viewDetails(m.id)}),l.appendChild(g)}),n.appendChild(l)}return a||n.addEventListener("click",()=>{const l=document.getElementById("newAppointmentModal");l.style.display="block",this.resetNewAppointmentForm(),document.getElementById("dataAgendamento").value=r,document.getElementById("dataAgendamento").dispatchEvent(new Event("change"));const c=u(new Date,"yyyy-MM-dd");document.getElementById("dataAgendamento").setAttribute("min",c)}),n}setupNotifications(){const e=document.getElementById("notificationsBtn"),a=document.getElementById("notificationsDropdown"),t=document.getElementById("closeNotifications");e.addEventListener("click",o=>{o.stopPropagation(),a.style.display==="flex"?a.style.display="none":(a.style.display="flex",this.loadNotifications())}),t.addEventListener("click",()=>{a.style.display="none"}),document.addEventListener("click",o=>{!e.contains(o.target)&&!a.contains(o.target)&&(a.style.display="none")}),this.loadNotificationCounts(),setInterval(()=>{this.loadNotificationCounts()},3e4)}async loadNotifications(){const e=document.getElementById("notificationsList");e.innerHTML=`
      <div class="notifications-loading">
        <div class="spinner"></div>
        <p>Carregando notificações...</p>
      </div>
    `;try{const a=await p.get("/notifications"),{notifications:t,unreadCount:o}=a,n=document.getElementById("notificationBadge");o>0?(n.textContent=o,n.style.display="block"):n.style.display="none",t.length===0?e.innerHTML=`
          <div class="notifications-empty">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
            </svg>
            <p>Nenhuma notificação</p>
          </div>
        `:(e.innerHTML=t.map(s=>`
          <div class="notification-item ${s.read?"":"unread"}" data-section="${s.section}">
            <div class="notification-header">
              <span class="notification-title">${s.title}</span>
              <span class="notification-time">${this.formatNotificationTime(s.time)}</span>
            </div>
            <div class="notification-message">${s.message}</div>
            <span class="notification-type-badge ${s.type}">${this.getTypeLabel(s.type)}</span>
          </div>
        `).join(""),e.querySelectorAll(".notification-item").forEach(s=>{s.addEventListener("click",()=>{const r=s.dataset.section;notificationsDropdown.style.display="none";const i=document.querySelector(`.nav-item[data-section="${r}"]`);i&&i.click()})}))}catch(a){console.error("Error loading notifications:",a),e.innerHTML=`
        <div class="notifications-empty">
          <p style="color: var(--status-danger);">Erro ao carregar notificações</p>
        </div>
      `}}async loadNotificationCounts(){try{const e=await p.get("/notifications/counts");Object.keys(e).forEach(o=>{const n=document.getElementById(`badge-${o}`);if(n){const s=e[o];s>0?(n.textContent=s,n.style.display="inline-block"):n.style.display="none"}});const a=Object.values(e).reduce((o,n)=>o+n,0),t=document.getElementById("notificationBadge");a>0?(t.textContent=a,t.style.display="block"):t.style.display="none"}catch(e){console.error("Error loading notification counts:",e)}}formatNotificationTime(e){const a=new Date(e),o=new Date-a,n=Math.floor(o/6e4),s=Math.floor(o/36e5),r=Math.floor(o/864e5);return n<1?"agora":n<60?`${n}m atrás`:s<24?`${s}h atrás`:r===1?"ontem":r<7?`${r}d atrás`:u(a,"dd/MM/yyyy")}getTypeLabel(e){return{agendamento:"Novo",agendamento_hoje:"Hoje",novo_cliente:"Cliente"}[e]||e}initCharts(){this.createRevenueChart(),this.createStatusChart()}async createRevenueChart(){const e=document.getElementById("revenueChart");if(!e)return;const a=[],t=[],o=new Date;for(let n=5;n>=0;n--){const s=new Date(o.getFullYear(),o.getMonth()-n,1),r=u(s,"yyyy-MM-dd"),i=u(new Date(s.getFullYear(),s.getMonth()+1,0),"yyyy-MM-dd");a.push(u(s,"MMM"));try{const l=await p.get(`/agendamentos/stats?data_inicio=${r}&data_fim=${i}`);t.push((l.receita_realizada||0)/100)}catch{t.push(0)}}this.revenueChart&&this.revenueChart.destroy(),this.revenueChart=new Chart(e,{type:"line",data:{labels:a,datasets:[{label:"Receita (R$)",data:t,borderColor:"#ed6a2b",backgroundColor:"rgba(237, 106, 43, 0.1)",borderWidth:3,tension:.4,fill:!0,pointRadius:6,pointHoverRadius:8,pointBackgroundColor:"#ed6a2b",pointBorderColor:"#fff",pointBorderWidth:2,pointHoverBackgroundColor:"#d85a1b",pointHoverBorderWidth:3}]},options:{responsive:!0,maintainAspectRatio:!1,plugins:{legend:{display:!0,position:"bottom",labels:{font:{size:12,weight:"600",family:"'Inter', sans-serif"},padding:15,usePointStyle:!0,pointStyle:"circle"}},tooltip:{backgroundColor:"rgba(0, 0, 0, 0.8)",titleFont:{size:14,weight:"bold"},bodyFont:{size:13},padding:12,cornerRadius:8,displayColors:!1,callbacks:{label:function(n){return"R$ "+n.parsed.y.toFixed(2)}}}},scales:{y:{beginAtZero:!0,ticks:{callback:function(n){return"R$ "+n.toFixed(0)},font:{size:11,weight:"500"},color:"#64748b"},grid:{color:"rgba(0, 0, 0, 0.05)",drawBorder:!1}},x:{ticks:{font:{size:11,weight:"600"},color:"#475569"},grid:{display:!1}}}}})}async createStatusChart(){const e=document.getElementById("statusChart");if(!e)return;const a=new Date,t=u(new Date(a.getFullYear(),a.getMonth(),1),"yyyy-MM-dd"),o=u(new Date(a.getFullYear(),a.getMonth()+1,0),"yyyy-MM-dd");try{const n=await p.get(`/agendamentos/stats?data_inicio=${t}&data_fim=${o}`);this.statusChart&&this.statusChart.destroy(),this.statusChart=new Chart(e,{type:"doughnut",data:{labels:["Pendentes","Confirmados","Realizados","Cancelados"],datasets:[{data:[n.pendentes||0,n.confirmados||0,n.realizados||0,n.cancelados||0],backgroundColor:["rgba(251, 191, 36, 0.8)","rgba(59, 130, 246, 0.8)","rgba(34, 197, 94, 0.8)","rgba(239, 68, 68, 0.8)"],borderColor:["#fbbf24","#3b82f6","#22c55e","#ef4444"],borderWidth:2,hoverOffset:15}]},options:{responsive:!0,maintainAspectRatio:!1,plugins:{legend:{position:"bottom",labels:{font:{size:12,weight:"600",family:"'Inter', sans-serif"},padding:15,usePointStyle:!0,pointStyle:"circle"}},tooltip:{backgroundColor:"rgba(0, 0, 0, 0.8)",titleFont:{size:14,weight:"bold"},bodyFont:{size:13},padding:12,cornerRadius:8,displayColors:!0,callbacks:{label:function(s){const r=s.label||"",i=s.parsed||0,l=s.dataset.data.reduce((m,g)=>m+g,0),c=l>0?(i/l*100).toFixed(1):0;return r+": "+i+" ("+c+"%)"}}}},cutout:"65%"}})}catch(n){console.error("Error creating status chart:",n)}}showChartDetail(e){document.querySelectorAll(".content-section").forEach(n=>n.classList.remove("active"));const t=e==="revenue"?"revenue-detail":"status-detail",o=document.getElementById(`section-${t}`);o&&o.classList.add("active"),e==="revenue"?this.renderRevenueDetail():e==="status"&&this.renderStatusDetail()}async renderRevenueDetail(){const e=document.getElementById("revenueDetailContent");e&&(e.innerHTML=`
      <!-- Summary Cards -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin-bottom: 24px;">
        <div class="stat-card" style="background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); color: white;">
          <div class="stat-label" style="color: rgba(255,255,255,0.9);">Receita Total (Últimos 6 meses)</div>
          <div class="stat-value" id="totalRevenue6m">Carregando...</div>
        </div>
        <div class="stat-card" style="background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: white;">
          <div class="stat-label" style="color: rgba(255,255,255,0.9);">Média Mensal</div>
          <div class="stat-value" id="avgRevenueMonth">Carregando...</div>
        </div>
        <div class="stat-card" style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white;">
          <div class="stat-label" style="color: rgba(255,255,255,0.9);">Melhor Mês</div>
          <div class="stat-value" id="bestMonth">Carregando...</div>
        </div>
        <div class="stat-card" style="background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); color: white;">
          <div class="stat-label" style="color: rgba(255,255,255,0.9);">Crescimento</div>
          <div class="stat-value" id="revenueGrowth">Carregando...</div>
        </div>
      </div>

      <!-- Charts Grid -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(500px, 1fr)); gap: 24px;">
        <!-- Revenue Trend Chart -->
        <div class="chart-card" style="cursor: default;">
          <div class="chart-header">
            <h3>Tendência de Receita (12 meses)</h3>
            <div class="chart-subtitle">Análise ano completo</div>
          </div>
          <div class="chart-container" style="position: relative; height: 400px;">
            <canvas id="revenueTrendChart"></canvas>
          </div>
        </div>

        <!-- Revenue by Type Chart -->
        <div class="chart-card" style="cursor: default;">
          <div class="chart-header">
            <h3>Receita por Tipo de Vistoria</h3>
            <div class="chart-subtitle">Distribuição por serviço</div>
          </div>
          <div class="chart-container" style="position: relative; height: 400px;">
            <canvas id="revenueByTypeChart"></canvas>
          </div>
        </div>

        <!-- Monthly Comparison Chart -->
        <div class="chart-card" style="cursor: default;">
          <div class="chart-header">
            <h3>Comparação Mensal</h3>
            <div class="chart-subtitle">Mês atual vs anterior</div>
          </div>
          <div class="chart-container" style="position: relative; height: 400px;">
            <canvas id="monthlyComparisonChart"></canvas>
          </div>
        </div>

        <!-- Daily Revenue Chart -->
        <div class="chart-card" style="cursor: default;">
          <div class="chart-header">
            <h3>Receita Diária (Mês Atual)</h3>
            <div class="chart-subtitle">Performance diária</div>
          </div>
          <div class="chart-container" style="position: relative; height: 400px;">
            <canvas id="dailyRevenueChart"></canvas>
          </div>
        </div>
      </div>
    `,await this.loadRevenueDetailCharts())}async loadRevenueDetailCharts(){const e=new Date,a=[],t=[];let o=0,n={name:"",value:0};for(let i=11;i>=0;i--){const l=new Date(e.getFullYear(),e.getMonth()-i,1),c=u(l,"yyyy-MM-dd"),m=u(new Date(l.getFullYear(),l.getMonth()+1,0),"yyyy-MM-dd");a.push(u(l,"MMM"));try{const h=((await p.get(`/agendamentos/stats?data_inicio=${c}&data_fim=${m}`)).receita_realizada||0)/100;t.push(h),o+=h,h>n.value&&(n={name:u(l,"MMM/yy"),value:h})}catch{t.push(0)}}const s=t.slice(-6).reduce((i,l)=>i+l,0);document.getElementById("totalRevenue6m").textContent=E.currency(s*100),document.getElementById("avgRevenueMonth").textContent=E.currency(s/6*100),document.getElementById("bestMonth").textContent=`${n.name} (${E.currency(n.value*100)})`;const r=t.length>=2?((t[t.length-1]-t[t.length-2])/t[t.length-2]*100).toFixed(1):0;document.getElementById("revenueGrowth").textContent=`${r>0?"+":""}${r}%`,this.createRevenueTrendChart(a,t),this.createRevenueByTypeChart(),this.createMonthlyComparisonChart(),this.createDailyRevenueChart()}createRevenueTrendChart(e,a){const t=document.getElementById("revenueTrendChart");t&&new Chart(t,{type:"line",data:{labels:e,datasets:[{label:"Receita (R$)",data:a,borderColor:"#ed6a2b",backgroundColor:"rgba(237, 106, 43, 0.1)",borderWidth:3,tension:.4,fill:!0,pointRadius:5,pointHoverRadius:7}]},options:{responsive:!0,maintainAspectRatio:!1,plugins:{legend:{display:!0,position:"top"},tooltip:{backgroundColor:"rgba(0, 0, 0, 0.8)",padding:12,cornerRadius:8,callbacks:{label:o=>"R$ "+o.parsed.y.toFixed(2)}}},scales:{y:{beginAtZero:!0,ticks:{callback:o=>"R$ "+o.toFixed(0)}}}}})}async createRevenueByTypeChart(){const e=document.getElementById("revenueByTypeChart");if(!e)return;const a=u(new Date(new Date().getFullYear(),0,1),"yyyy-MM-dd"),t=u(new Date(new Date().getFullYear(),11,31),"yyyy-MM-dd");try{const o=await p.get(`/agendamentos?data_inicio=${a}&data_fim=${t}`),n={cautelar:0,transferencia:0,outros:0};o.agendamentos.forEach(s=>{s.status==="realizado"&&s.preco&&(n[s.tipo_vistoria]=(n[s.tipo_vistoria]||0)+s.preco/100)}),new Chart(e,{type:"doughnut",data:{labels:["Cautelar","Transferência","Outros"],datasets:[{data:[n.cautelar,n.transferencia,n.outros],backgroundColor:["#ed6a2b","#3b82f6","#22c55e"],borderWidth:2}]},options:{responsive:!0,maintainAspectRatio:!1,plugins:{legend:{position:"bottom"},tooltip:{callbacks:{label:s=>{const r=s.label||"",i=s.parsed||0;return r+": R$ "+i.toFixed(2)}}}},cutout:"60%"}})}catch(o){console.error("Error creating revenue by type chart:",o)}}async createMonthlyComparisonChart(){const e=document.getElementById("monthlyComparisonChart");if(!e)return;const a=new Date,t=new Date(a.getFullYear(),a.getMonth(),1),o=new Date(a.getFullYear(),a.getMonth()-1,1);try{const[n,s]=await Promise.all([p.get(`/agendamentos/stats?data_inicio=${u(t,"yyyy-MM-dd")}&data_fim=${u(new Date(a.getFullYear(),a.getMonth()+1,0),"yyyy-MM-dd")}`),p.get(`/agendamentos/stats?data_inicio=${u(o,"yyyy-MM-dd")}&data_fim=${u(new Date(a.getFullYear(),a.getMonth(),0),"yyyy-MM-dd")}`)]);new Chart(e,{type:"bar",data:{labels:["Mês Anterior","Mês Atual"],datasets:[{label:"Receita Realizada",data:[(s.receita_realizada||0)/100,(n.receita_realizada||0)/100],backgroundColor:["#94a3b8","#ed6a2b"],borderRadius:8}]},options:{responsive:!0,maintainAspectRatio:!1,plugins:{legend:{display:!1},tooltip:{callbacks:{label:r=>"R$ "+r.parsed.y.toFixed(2)}}},scales:{y:{beginAtZero:!0,ticks:{callback:r=>"R$ "+r.toFixed(0)}}}}})}catch(n){console.error("Error creating monthly comparison chart:",n)}}async createDailyRevenueChart(){const e=document.getElementById("dailyRevenueChart");if(!e)return;const a=new Date,t=u(new Date(a.getFullYear(),a.getMonth(),1),"yyyy-MM-dd"),o=u(new Date(a.getFullYear(),a.getMonth()+1,0),"yyyy-MM-dd");try{const n=await p.get(`/agendamentos?data_inicio=${t}&data_fim=${o}`),s={};n.agendamentos.forEach(l=>{l.status==="realizado"&&l.preco&&(s[l.data]=(s[l.data]||0)+l.preco/100)});const r=Object.keys(s).sort(),i=r.map(l=>s[l]);new Chart(e,{type:"bar",data:{labels:r.map(l=>u(new Date(l+"T00:00:00"),"dd/MM")),datasets:[{label:"Receita Diária (R$)",data:i,backgroundColor:"#ed6a2b",borderRadius:6}]},options:{responsive:!0,maintainAspectRatio:!1,plugins:{legend:{display:!0,position:"top"},tooltip:{callbacks:{label:l=>"R$ "+l.parsed.y.toFixed(2)}}},scales:{y:{beginAtZero:!0,ticks:{callback:l=>"R$ "+l.toFixed(0)}}}}})}catch(n){console.error("Error creating daily revenue chart:",n)}}async renderStatusDetail(){const e=document.getElementById("statusDetailContent");e&&(e.innerHTML=`
      <!-- Summary Cards -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin-bottom: 24px;">
        <div class="stat-card" style="background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%); color: white;">
          <div class="stat-label" style="color: rgba(255,255,255,0.9);">Total Pendentes</div>
          <div class="stat-value" id="totalPendentes">Carregando...</div>
        </div>
        <div class="stat-card" style="background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: white;">
          <div class="stat-label" style="color: rgba(255,255,255,0.9);">Total Confirmados</div>
          <div class="stat-value" id="totalConfirmados">Carregando...</div>
        </div>
        <div class="stat-card" style="background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); color: white;">
          <div class="stat-label" style="color: rgba(255,255,255,0.9);">Total Realizados</div>
          <div class="stat-value" id="totalRealizados">Carregando...</div>
        </div>
        <div class="stat-card" style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: white;">
          <div class="stat-label" style="color: rgba(255,255,255,0.9);">Taxa de Cancelamento</div>
          <div class="stat-value" id="taxaCancelamento">Carregando...</div>
        </div>
      </div>

      <!-- Charts Grid -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(500px, 1fr)); gap: 24px;">
        <!-- Status Evolution Chart -->
        <div class="chart-card" style="cursor: default;">
          <div class="chart-header">
            <h3>Evolução de Status (6 meses)</h3>
            <div class="chart-subtitle">Histórico mensal</div>
          </div>
          <div class="chart-container" style="position: relative; height: 400px;">
            <canvas id="statusEvolutionChart"></canvas>
          </div>
        </div>

        <!-- Completion Rate Chart -->
        <div class="chart-card" style="cursor: default;">
          <div class="chart-header">
            <h3>Taxa de Conclusão</h3>
            <div class="chart-subtitle">Realizados vs Total</div>
          </div>
          <div class="chart-container" style="position: relative; height: 400px;">
            <canvas id="completionRateChart"></canvas>
          </div>
        </div>

        <!-- Status by Type Chart -->
        <div class="chart-card" style="cursor: default;">
          <div class="chart-header">
            <h3>Status por Tipo de Vistoria</h3>
            <div class="chart-subtitle">Distribuição detalhada</div>
          </div>
          <div class="chart-container" style="position: relative; height: 400px;">
            <canvas id="statusByTypeChart"></canvas>
          </div>
        </div>

        <!-- Weekly Status Chart -->
        <div class="chart-card" style="cursor: default;">
          <div class="chart-header">
            <h3>Status da Semana</h3>
            <div class="chart-subtitle">Últimos 7 dias</div>
          </div>
          <div class="chart-container" style="position: relative; height: 400px;">
            <canvas id="weeklyStatusChart"></canvas>
          </div>
        </div>
      </div>
    `,await this.loadStatusDetailCharts())}async loadStatusDetailCharts(){const e=new Date,a=u(new Date(e.getFullYear(),0,1),"yyyy-MM-dd"),t=u(new Date(e.getFullYear(),11,31),"yyyy-MM-dd");try{const o=await p.get(`/agendamentos?data_inicio=${a}&data_fim=${t}`),n={pendente:0,confirmado:0,realizado:0,cancelado:0};o.agendamentos.forEach(i=>{n[i.status]=(n[i.status]||0)+1});const s=o.total||0,r=s>0?(n.cancelado/s*100).toFixed(1):0;document.getElementById("totalPendentes").textContent=n.pendente,document.getElementById("totalConfirmados").textContent=n.confirmado,document.getElementById("totalRealizados").textContent=n.realizado,document.getElementById("taxaCancelamento").textContent=`${r}%`,this.createStatusEvolutionChart(),this.createCompletionRateChart(n,s),this.createStatusByTypeChart(),this.createWeeklyStatusChart()}catch(o){console.error("Error loading status detail charts:",o)}}async createStatusEvolutionChart(){const e=document.getElementById("statusEvolutionChart");if(!e)return;const a=new Date,t=[],o=[],n=[],s=[],r=[];for(let i=5;i>=0;i--){const l=new Date(a.getFullYear(),a.getMonth()-i,1),c=u(l,"yyyy-MM-dd"),m=u(new Date(l.getFullYear(),l.getMonth()+1,0),"yyyy-MM-dd");t.push(u(l,"MMM"));try{const g=await p.get(`/agendamentos/stats?data_inicio=${c}&data_fim=${m}`);o.push(g.pendentes||0),n.push(g.confirmados||0),s.push(g.realizados||0),r.push(g.cancelados||0)}catch{o.push(0),n.push(0),s.push(0),r.push(0)}}new Chart(e,{type:"line",data:{labels:t,datasets:[{label:"Pendentes",data:o,borderColor:"#fbbf24",backgroundColor:"rgba(251, 191, 36, 0.1)",tension:.4},{label:"Confirmados",data:n,borderColor:"#3b82f6",backgroundColor:"rgba(59, 130, 246, 0.1)",tension:.4},{label:"Realizados",data:s,borderColor:"#22c55e",backgroundColor:"rgba(34, 197, 94, 0.1)",tension:.4},{label:"Cancelados",data:r,borderColor:"#ef4444",backgroundColor:"rgba(239, 68, 68, 0.1)",tension:.4}]},options:{responsive:!0,maintainAspectRatio:!1,plugins:{legend:{display:!0,position:"top"}},scales:{y:{beginAtZero:!0}}}})}createCompletionRateChart(e,a){const t=document.getElementById("completionRateChart");t&&(a>0&&(e.realizado/a*100).toFixed(1),new Chart(t,{type:"doughnut",data:{labels:["Realizados","Não Realizados"],datasets:[{data:[e.realizado,a-e.realizado],backgroundColor:["#22c55e","#e5e7eb"],borderWidth:0}]},options:{responsive:!0,maintainAspectRatio:!1,plugins:{legend:{position:"bottom"},tooltip:{callbacks:{label:o=>{const n=o.label||"",s=o.parsed||0,r=a>0?(s/a*100).toFixed(1):0;return n+": "+s+" ("+r+"%)"}}}},cutout:"70%"}}))}async createStatusByTypeChart(){const e=document.getElementById("statusByTypeChart");if(!e)return;const a=new Date,t=u(new Date(a.getFullYear(),0,1),"yyyy-MM-dd"),o=u(new Date(a.getFullYear(),11,31),"yyyy-MM-dd");try{const n=await p.get(`/agendamentos?data_inicio=${t}&data_fim=${o}`),s={cautelar:{pendente:0,confirmado:0,realizado:0,cancelado:0},transferencia:{pendente:0,confirmado:0,realizado:0,cancelado:0},outros:{pendente:0,confirmado:0,realizado:0,cancelado:0}};n.agendamentos.forEach(r=>{s[r.tipo_vistoria]&&(s[r.tipo_vistoria][r.status]=(s[r.tipo_vistoria][r.status]||0)+1)}),new Chart(e,{type:"bar",data:{labels:["Cautelar","Transferência","Outros"],datasets:[{label:"Pendentes",data:[s.cautelar.pendente,s.transferencia.pendente,s.outros.pendente],backgroundColor:"#fbbf24"},{label:"Confirmados",data:[s.cautelar.confirmado,s.transferencia.confirmado,s.outros.confirmado],backgroundColor:"#3b82f6"},{label:"Realizados",data:[s.cautelar.realizado,s.transferencia.realizado,s.outros.realizado],backgroundColor:"#22c55e"},{label:"Cancelados",data:[s.cautelar.cancelado,s.transferencia.cancelado,s.outros.cancelado],backgroundColor:"#ef4444"}]},options:{responsive:!0,maintainAspectRatio:!1,plugins:{legend:{position:"top"}},scales:{x:{stacked:!0},y:{stacked:!0,beginAtZero:!0}}}})}catch(n){console.error("Error creating status by type chart:",n)}}async createWeeklyStatusChart(){const e=document.getElementById("weeklyStatusChart");if(!e)return;const a=new Date,t=new Date(a.getTime()-7*24*60*60*1e3);try{const o=await p.get(`/agendamentos?data_inicio=${u(t,"yyyy-MM-dd")}&data_fim=${u(a,"yyyy-MM-dd")}`),n={};for(let r=0;r<7;r++){const i=u(new Date(a.getTime()-r*24*60*60*1e3),"yyyy-MM-dd");n[i]={pendente:0,confirmado:0,realizado:0,cancelado:0}}o.agendamentos.forEach(r=>{n[r.data]&&(n[r.data][r.status]=(n[r.data][r.status]||0)+1)});const s=Object.keys(n).sort();new Chart(e,{type:"bar",data:{labels:s.map(r=>u(new Date(r+"T00:00:00"),"dd/MM")),datasets:[{label:"Pendentes",data:s.map(r=>n[r].pendente),backgroundColor:"#fbbf24"},{label:"Confirmados",data:s.map(r=>n[r].confirmado),backgroundColor:"#3b82f6"},{label:"Realizados",data:s.map(r=>n[r].realizado),backgroundColor:"#22c55e"},{label:"Cancelados",data:s.map(r=>n[r].cancelado),backgroundColor:"#ef4444"}]},options:{responsive:!0,maintainAspectRatio:!1,plugins:{legend:{position:"top"}},scales:{y:{beginAtZero:!0}}}})}catch(o){console.error("Error creating weekly status chart:",o)}}async exportChart(e){const a=e==="revenue"?"revenueChart":"statusChart",t=document.getElementById(a);if(t)try{const{jsPDF:o}=window.jspdf,n=new o("l","mm","a4"),s=t.toDataURL("image/png");n.addImage(s,"PNG",15,15,270,150),n.save(`${e}-chart-${u(new Date,"yyyy-MM-dd")}.pdf`)}catch(o){console.error("Error exporting chart:",o),alert("Erro ao exportar gráfico. Tente novamente.")}}async exportChartDetail(e){const a=e==="revenue"?"revenueDetailContent":"statusDetailContent",t=document.getElementById(a);if(t)try{const o=await html2canvas(t,{scale:2,backgroundColor:"#f8fafc",logging:!1}),{jsPDF:n}=window.jspdf,s=new n("l","mm","a4"),r=o.toDataURL("image/png"),i=280,l=o.height*i/o.width;let c=l,m=10;for(s.addImage(r,"PNG",10,m,i,l),c-=190;c>=0;)m=c-l+10,s.addPage(),s.addImage(r,"PNG",10,m,i,l),c-=190;s.save(`${e}-detail-${u(new Date,"yyyy-MM-dd")}.pdf`)}catch(o){console.error("Error exporting chart detail:",o),alert("Erro ao exportar relatório. Tente novamente.")}}setupEmpresasModal(){const e=document.getElementById("empresaSlug"),a=document.getElementById("previewSlug");e&&a&&e.addEventListener("input",s=>{a.textContent=s.target.value||"..."});const t=document.getElementById("cancelarEmpresa");t&&t.addEventListener("click",()=>{const s=document.getElementById("modalEmpresa");s&&(s.style.display="none")});const o=document.getElementById("fecharModalEmpresa");o&&o.addEventListener("click",()=>{const s=document.getElementById("modalEmpresa");s&&(s.style.display="none")});const n=document.getElementById("modalEmpresa");n&&n.addEventListener("click",s=>{s.target===n&&(n.style.display="none")})}}window.adminPanel=new oe;window.empresasManager=window.adminPanel.empresasManager;
