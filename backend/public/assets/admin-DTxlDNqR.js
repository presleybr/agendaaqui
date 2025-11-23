import{t as w,c as x,m as A,e as L,b as m,a as p,g as B,f as E}from"./format-BlW7tm3V.js";function F(d,e){const n=w(d);if(isNaN(e))return x(d,NaN);const a=n.getDate(),o=x(d,n.getTime());o.setMonth(n.getMonth()+e+1,0);const t=o.getDate();return a>=t?o:(n.setFullYear(o.getFullYear(),o.getMonth(),a),n)}function $(d){const e=w(d),n=e.getMonth();return e.setFullYear(e.getFullYear(),n+1,0),e.setHours(23,59,59,999),e}function _(d,e){const n=w(d.start),a=w(d.end);let o=+n>+a;const t=o?+n:+a,s=o?a:n;s.setHours(0,0,0,0);let i=1;const r=[];for(;+s<=t;)r.push(w(s)),s.setDate(s.getDate()+i),s.setHours(0,0,0,0);return o?r.reverse():r}function k(d){const e=w(d);return e.setDate(1),e.setHours(0,0,0,0),e}function T(d,e){const a=H(d);let o;if(a.date){const r=O(a.date,2);o=Y(r.restDateString,r.year)}if(!o||isNaN(o.getTime()))return new Date(NaN);const t=o.getTime();let s=0,i;if(a.time&&(s=j(a.time),isNaN(s)))return new Date(NaN);if(a.timezone){if(i=U(a.timezone),isNaN(i))return new Date(NaN)}else{const r=new Date(t+s),l=new Date(0);return l.setFullYear(r.getUTCFullYear(),r.getUTCMonth(),r.getUTCDate()),l.setHours(r.getUTCHours(),r.getUTCMinutes(),r.getUTCSeconds(),r.getUTCMilliseconds()),l}return new Date(t+s+i)}const I={dateTimeDelimiter:/[T ]/,timeZoneDelimiter:/[Z ]/i,timezone:/([Z+-].*)$/},N=/^-?(?:(\d{3})|(\d{2})(?:-?(\d{2}))?|W(\d{2})(?:-?(\d{1}))?|)$/,P=/^(\d{2}(?:[.,]\d*)?)(?::?(\d{2}(?:[.,]\d*)?))?(?::?(\d{2}(?:[.,]\d*)?))?$/,z=/^([+-])(\d{2})(?::?(\d{2}))?$/;function H(d){const e={},n=d.split(I.dateTimeDelimiter);let a;if(n.length>2)return e;if(/:/.test(n[0])?a=n[0]:(e.date=n[0],a=n[1],I.timeZoneDelimiter.test(e.date)&&(e.date=d.split(I.timeZoneDelimiter)[0],a=d.substr(e.date.length,d.length))),a){const o=I.timezone.exec(a);o?(e.time=a.replace(o[1],""),e.timezone=o[1]):e.time=a}return e}function O(d,e){const n=new RegExp("^(?:(\\d{4}|[+-]\\d{"+(4+e)+"})|(\\d{2}|[+-]\\d{"+(2+e)+"})$)"),a=d.match(n);if(!a)return{year:NaN,restDateString:""};const o=a[1]?parseInt(a[1]):null,t=a[2]?parseInt(a[2]):null;return{year:t===null?o:t*100,restDateString:d.slice((a[1]||a[2]).length)}}function Y(d,e){if(e===null)return new Date(NaN);const n=d.match(N);if(!n)return new Date(NaN);const a=!!n[4],o=M(n[1]),t=M(n[2])-1,s=M(n[3]),i=M(n[4]),r=M(n[5])-1;if(a)return G(e,i,r)?V(e,i,r):new Date(NaN);{const l=new Date(0);return!Z(e,t,s)||!q(e,o)?new Date(NaN):(l.setUTCFullYear(e,t,Math.max(o,s)),l)}}function M(d){return d?parseInt(d):1}function j(d){const e=d.match(P);if(!e)return NaN;const n=D(e[1]),a=D(e[2]),o=D(e[3]);return J(n,a,o)?n*A+a*L+o*1e3:NaN}function D(d){return d&&parseFloat(d.replace(",","."))||0}function U(d){if(d==="Z")return 0;const e=d.match(z);if(!e)return 0;const n=e[1]==="+"?-1:1,a=parseInt(e[2]),o=e[3]&&parseInt(e[3])||0;return Q(a,o)?n*(a*A+o*L):NaN}function V(d,e,n){const a=new Date(0);a.setUTCFullYear(d,0,4);const o=a.getUTCDay()||7,t=(e-1)*7+n+1-o;return a.setUTCDate(a.getUTCDate()+t),a}const W=[31,null,31,30,31,30,31,31,30,31,30,31];function S(d){return d%400===0||d%4===0&&d%100!==0}function Z(d,e,n){return e>=0&&e<=11&&n>=1&&n<=(W[e]||(S(d)?29:28))}function q(d,e){return e>=1&&e<=(S(d)?366:365)}function G(d,e,n){return e>=1&&e<=53&&n>=0&&n<=6}function J(d,e,n){return d===24?e===0&&n===0:n>=0&&n<60&&e>=0&&e<60&&d>=0&&d<25}function Q(d,e){return e>=0&&e<=59}function K(d,e){return F(d,-1)}class X{constructor(){this.charts={revenue:null,status:null,services:null,hourly:null},this.currentPeriod={startDate:null,endDate:null},this.initializeEventListeners(),this.setCurrentMonthPeriod()}initializeEventListeners(){const e=document.getElementById("setCurrentMonthBtn"),n=document.getElementById("setLastMonthBtn"),a=document.getElementById("generateReportBtn"),o=document.getElementById("exportReportPDF");e&&e.addEventListener("click",()=>this.setCurrentMonthPeriod()),n&&n.addEventListener("click",()=>this.setLastMonthPeriod()),a&&a.addEventListener("click",()=>this.generateReport()),o&&o.addEventListener("click",()=>this.exportToPDF())}setCurrentMonthPeriod(){const e=new Date,n=k(e),a=$(e);this.setPeriod(n,a)}setLastMonthPeriod(){const e=K(new Date),n=k(e),a=$(e);this.setPeriod(n,a)}setPeriod(e,n){const a=document.getElementById("reportStartDate"),o=document.getElementById("reportEndDate");a&&(a.value=m(e,"yyyy-MM-dd")),o&&(o.value=m(n,"yyyy-MM-dd")),this.currentPeriod={startDate:m(e,"yyyy-MM-dd"),endDate:m(n,"yyyy-MM-dd")}}async generateReport(){const e=document.getElementById("reportStartDate"),n=document.getElementById("reportEndDate");if(!(e!=null&&e.value)||!(n!=null&&n.value)){alert("Por favor, selecione as datas de início e fim do período.");return}this.currentPeriod={startDate:e.value,endDate:n.value};const a=document.getElementById("reportContent");a&&a.classList.add("loading");try{const o=await this.fetchReportData();this.updateStatsCards(o),this.generateCharts(o),this.updateTopServicesTable(o)}catch(o){console.error("Erro ao gerar relatório:",o),alert("Erro ao gerar relatório. Tente novamente.")}finally{a&&a.classList.remove("loading")}}async fetchReportData(){const{startDate:e,endDate:n}=this.currentPeriod,a=await p.get(`/agendamentos?data_inicio=${e}&data_fim=${n}`),o=Array.isArray(a==null?void 0:a.agendamentos)?a.agendamentos:Array.isArray(a)?a:[],t=await p.get(`/agendamentos/stats?data_inicio=${e}&data_fim=${n}`);return console.log("📊 Dados do relatório:",{appointments:o.length,stats:t}),{appointments:o,stats:t||{},period:{startDate:e,endDate:n}}}updateStatsCards(e){const{appointments:n,stats:a}=e,o=Array.isArray(n)?n:[],t=o.length,s=document.getElementById("reportTotalAppointments");s&&(s.textContent=t);const i=o.reduce((v,C)=>{const y=parseFloat(C.preco)||0;return v+y/100},0),r=document.getElementById("reportTotalRevenue");r&&(r.textContent=`R$ ${i.toFixed(2)}`);const l=new Set(o.map(v=>v.cliente_cpf||v.cliente_id)).size,c=document.getElementById("reportNewClients");c&&(c.textContent=l);const u=o.filter(v=>v.status==="confirmado"||v.status==="realizado").length,g=t>0?(u/t*100).toFixed(1):"0",h=document.getElementById("reportConfirmationRate");h&&(h.textContent=`${g}%`),this.updateChangeIndicators(e)}updateChangeIndicators(e){[{id:"reportAppointmentsChange",value:"+12.5%",type:"positive"},{id:"reportRevenueChange",value:"+8.3%",type:"positive"},{id:"reportClientsChange",value:"+15.2%",type:"positive"},{id:"reportConfirmationChange",value:"-2.1%",type:"negative"}].forEach(({id:a,value:o,type:t})=>{const s=document.getElementById(a);s&&(s.textContent=o,s.className=`stat-change ${t}`)})}generateCharts(e){this.generateRevenueChart(e),this.generateStatusChart(e),this.generateServicesChart(e),this.generateHourlyChart(e)}generateRevenueChart(e){const n=document.getElementById("reportRevenueChart");if(!n)return;this.charts.revenue&&this.charts.revenue.destroy();const{appointments:a,period:o}=e,{startDate:t,endDate:s}=o,i=Array.isArray(a)?a:[],r=_({start:T(t),end:T(s)}),l=r.map(u=>m(u,"dd/MM")),c=r.map(u=>{const g=m(u,"yyyy-MM-dd");return i.filter(h=>h.data_agendamento===g).reduce((h,v)=>{const C=parseFloat(v.preco)||0;return h+C/100},0)});this.charts.revenue=new Chart(n,{type:"line",data:{labels:l,datasets:[{label:"Receita Diária (R$)",data:c,borderColor:"#ed6a2b",backgroundColor:"rgba(237, 106, 43, 0.1)",borderWidth:3,tension:.4,fill:!0,pointRadius:4,pointHoverRadius:6,pointBackgroundColor:"#ed6a2b",pointBorderColor:"#fff",pointBorderWidth:2}]},options:{responsive:!0,maintainAspectRatio:!1,plugins:{legend:{display:!0,position:"top",labels:{padding:20,font:{size:12,weight:"600"}}},tooltip:{backgroundColor:"rgba(0, 0, 0, 0.8)",padding:12,titleFont:{size:14,weight:"bold"},bodyFont:{size:13},callbacks:{label:u=>`Receita: R$ ${u.parsed.y.toFixed(2)}`}}},scales:{y:{beginAtZero:!0,ticks:{callback:u=>`R$ ${u}`},grid:{color:"rgba(0, 0, 0, 0.05)"}},x:{grid:{display:!1}}}}})}generateStatusChart(e){const n=document.getElementById("reportStatusChart");if(!n)return;this.charts.status&&this.charts.status.destroy();const{appointments:a}=e,o=Array.isArray(a)?a:[],t={pendente:0,confirmado:0,realizado:0,cancelado:0};o.forEach(s=>{t.hasOwnProperty(s.status)&&t[s.status]++}),this.charts.status=new Chart(n,{type:"doughnut",data:{labels:["Pendentes","Confirmados","Realizados","Cancelados"],datasets:[{data:[t.pendente,t.confirmado,t.realizado,t.cancelado],backgroundColor:["#fbbf24","#3b82f6","#22c55e","#ef4444"],borderWidth:3,borderColor:"#fff"}]},options:{responsive:!0,maintainAspectRatio:!1,plugins:{legend:{position:"right",labels:{padding:15,font:{size:12,weight:"600"},generateLabels:s=>{const i=s.data;return i.labels.length&&i.datasets.length?i.labels.map((r,l)=>{const c=i.datasets[0].data[l],u=i.datasets[0].data.reduce((h,v)=>h+v,0),g=u>0?(c/u*100).toFixed(1):"0";return{text:`${r}: ${c} (${g}%)`,fillStyle:i.datasets[0].backgroundColor[l],hidden:!1,index:l}}):[]}}},tooltip:{backgroundColor:"rgba(0, 0, 0, 0.8)",padding:12,callbacks:{label:s=>{const i=s.label||"",r=s.parsed,l=s.dataset.data.reduce((u,g)=>u+g,0),c=(r/l*100).toFixed(1);return`${i}: ${r} (${c}%)`}}}}}})}generateServicesChart(e){const n=document.getElementById("reportServicesChart");if(!n)return;this.charts.services&&this.charts.services.destroy();const{appointments:a}=e,o=Array.isArray(a)?a:[],t={};o.forEach(c=>{const u=c.tipo_vistoria||"Não especificado";t[u]=(t[u]||0)+1});const s=Object.keys(t),i=Object.values(t),r={cautelar:"#8b5cf6",transferencia:"#06b6d4",outros:"#f59e0b"},l=s.map(c=>r[c]||"#94a3b8");this.charts.services=new Chart(n,{type:"bar",data:{labels:s.map(c=>c.charAt(0).toUpperCase()+c.slice(1)),datasets:[{label:"Quantidade",data:i,backgroundColor:l,borderRadius:8,borderWidth:0}]},options:{responsive:!0,maintainAspectRatio:!1,plugins:{legend:{display:!1},tooltip:{backgroundColor:"rgba(0, 0, 0, 0.8)",padding:12}},scales:{y:{beginAtZero:!0,ticks:{stepSize:1},grid:{color:"rgba(0, 0, 0, 0.05)"}},x:{grid:{display:!1}}}}})}generateHourlyChart(e){const n=document.getElementById("reportHourlyChart");if(!n)return;this.charts.hourly&&this.charts.hourly.destroy();const{appointments:a}=e,o=Array.isArray(a)?a:[],t=Array(24).fill(0);o.forEach(r=>{if(r.horario_agendamento){const l=parseInt(r.horario_agendamento.split(":")[0]);l>=0&&l<24&&t[l]++}});const s=[],i=[];t.forEach((r,l)=>{r>0&&(s.push(`${l.toString().padStart(2,"0")}:00`),i.push(r))}),this.charts.hourly=new Chart(n,{type:"bar",data:{labels:s,datasets:[{label:"Agendamentos",data:i,backgroundColor:"rgba(34, 197, 94, 0.7)",borderColor:"#22c55e",borderWidth:2,borderRadius:8}]},options:{responsive:!0,maintainAspectRatio:!1,plugins:{legend:{display:!1},tooltip:{backgroundColor:"rgba(0, 0, 0, 0.8)",padding:12}},scales:{y:{beginAtZero:!0,ticks:{stepSize:1},grid:{color:"rgba(0, 0, 0, 0.05)"}},x:{grid:{display:!1}}}}})}updateTopServicesTable(e){const n=document.getElementById("topServicesTable");if(!n)return;const{appointments:a}=e,o=Array.isArray(a)?a:[],t={};o.forEach(i=>{const r=i.tipo_vistoria||"Não especificado";t[r]||(t[r]={count:0,revenue:0}),t[r].count++;const l=parseFloat(i.preco)||0;t[r].revenue+=l/100});const s=Object.entries(t).sort((i,r)=>r[1].count-i[1].count).slice(0,5);if(s.length===0){n.innerHTML=`
        <tr>
          <td colspan="5" style="text-align: center; padding: 40px; color: #666;">
            Nenhum dado disponível para o período selecionado
          </td>
        </tr>
      `;return}n.innerHTML=s.map(([i,r],l)=>{const c=r.count>0?r.revenue/r.count:0;return`
        <tr>
          <td>${["🥇","🥈","🥉"][l]||""} ${l+1}º</td>
          <td>${i.charAt(0).toUpperCase()+i.slice(1)}</td>
          <td>${r.count}</td>
          <td>R$ ${r.revenue.toFixed(2)}</td>
          <td>R$ ${c.toFixed(2)}</td>
        </tr>
      `}).join("")}async exportToPDF(){if(!this.currentPeriod.startDate||!this.currentPeriod.endDate){alert("Por favor, gere um relatório antes de exportar.");return}const e=document.getElementById("reportContent");if(e)try{const n=await html2canvas(e,{scale:2,backgroundColor:"#f8fafc",logging:!1,windowWidth:1920,windowHeight:e.scrollHeight}),{jsPDF:a}=window.jspdf,o=new a("l","mm","a4"),t=n.toDataURL("image/png"),s=280,i=n.height*s/n.width;let r=i,l=10;for(o.addImage(t,"PNG",10,l,s,i),r-=190;r>=0;)l=r-i+10,o.addPage(),o.addImage(t,"PNG",10,l,s,i),r-=190;const c=`relatorio-${this.currentPeriod.startDate}-${this.currentPeriod.endDate}.pdf`;o.save(c)}catch(n){console.error("Erro ao exportar PDF:",n),alert("Erro ao exportar relatório. Tente novamente.")}}destroy(){Object.values(this.charts).forEach(e=>{e&&e.destroy()})}}class ee{constructor(){this.currentFilters={},this.appointments=[],this.currentCalendarDate=new Date,this.reportsManager=null,this.init()}init(){B.isAuthenticated()?this.showDashboard():this.showLogin()}showLogin(){document.getElementById("loginScreen").style.display="flex",document.getElementById("adminDashboard").style.display="none",document.getElementById("loginForm").addEventListener("submit",async a=>{a.preventDefault(),await this.handleLogin()});const n=document.getElementById("demoLoginBtn");n&&n.addEventListener("click",async()=>{document.getElementById("loginEmail").value="admin@vistoria.com",document.getElementById("loginPassword").value="Admin123!@#",await this.handleLogin()})}async handleLogin(){const e=document.getElementById("loginEmail").value,n=document.getElementById("loginPassword").value,a=document.getElementById("loginError");try{await B.login(e,n),this.showDashboard()}catch{a.textContent="Credenciais inválidas",a.style.display="block"}}async showDashboard(){document.getElementById("loginScreen").style.display="none",document.getElementById("adminDashboard").style.display="flex";const e=B.getUser();document.getElementById("sidebarUserName").textContent=(e==null?void 0:e.nome)||"Admin",await this.loadStats(),await this.loadAppointments(),this.initCharts(),this.reportsManager=new X,this.setupNavigation(),this.setupConfiguracoes(),document.getElementById("logoutBtn").addEventListener("click",()=>{B.logout(),location.reload()}),document.getElementById("filterBtn").addEventListener("click",()=>{this.applyFilters()}),document.getElementById("clearFilterBtn").addEventListener("click",()=>{this.clearFilters()});const n=document.getElementById("appointmentModal");document.querySelector(".close").addEventListener("click",()=>{n.style.display="none"}),window.addEventListener("click",o=>{o.target===n&&(n.style.display="none")}),this.setupNewAppointmentModal(),this.setupNewClienteModal(),this.setupNotifications()}setupNavigation(){const e=document.querySelectorAll(".nav-item"),n=document.querySelectorAll(".content-section"),a=document.getElementById("pageTitle");e.forEach(s=>{s.addEventListener("click",async i=>{i.preventDefault();const r=s.dataset.section;e.forEach(u=>u.classList.remove("active")),s.classList.add("active"),n.forEach(u=>u.classList.remove("active"));const l=document.getElementById(`section-${r}`);l&&l.classList.add("active");const c={dashboard:"Dashboard",agendamentos:"Agendamentos",clientes:"Clientes",calendario:"Calendário",relatorios:"Relatórios",configuracoes:"Configurações"};a.textContent=c[r]||"Dashboard",r==="agendamentos"?(console.log("Navigating to Agendamentos - reloading data..."),await this.loadAppointments()):r==="dashboard"?(console.log("Navigating to Dashboard - reloading data..."),await this.loadStats(),await this.loadAppointments()):r==="clientes"?(console.log("Navigating to Clientes - reloading data..."),await this.loadClientes()):r==="calendario"?(console.log("Navigating to Calendario - rendering calendar..."),await this.renderCalendar()):r==="configuracoes"&&(console.log("Navigating to Configuracoes - loading settings..."),await this.loadConfiguracoes())})});const o=document.getElementById("menuToggle"),t=document.querySelector(".sidebar");o&&t&&o.addEventListener("click",()=>{t.classList.toggle("active")})}async loadStats(){var e,n;try{console.log("📊 Loading stats...");const a=m(new Date,"yyyy-MM-dd"),o=m(new Date(new Date().getFullYear(),new Date().getMonth(),1),"yyyy-MM-dd"),t=m(new Date(new Date().getFullYear(),new Date().getMonth()+1,0),"yyyy-MM-dd");console.log("   Today:",a),console.log("   Month range:",o,"to",t);const[s,i]=await Promise.all([p.get(`/agendamentos?data=${a}`),p.get(`/agendamentos/stats?data_inicio=${o}&data_fim=${t}`)]);console.log("✅ Stats loaded:",{todayData:s,monthData:i}),document.getElementById("statToday").textContent=s.total||0,document.getElementById("statPending").textContent=i.pendentes||0,document.getElementById("statConfirmed").textContent=i.confirmados||0,document.getElementById("statRevenue").textContent=E.currency(i.receita_total||0),console.log("✅ Stats rendered to DOM")}catch(a){console.error("❌ Error loading stats:",a),console.error("   Error details:",(e=a.response)==null?void 0:e.data),console.error("   Error status:",(n=a.response)==null?void 0:n.status),document.getElementById("statToday").textContent="0",document.getElementById("statPending").textContent="0",document.getElementById("statConfirmed").textContent="0",document.getElementById("statRevenue").textContent="R$ 0,00"}}async loadAppointments(){var o,t,s;const e=document.getElementById("dashboardAppointmentsTable"),n=document.getElementById("agendamentosAppointmentsTable"),a=`
      <tr>
        <td colspan="8" style="text-align: center; padding: 40px;">
          <div class="spinner"></div>
          <p style="margin-top: 10px; color: #666;">Carregando agendamentos...</p>
        </td>
      </tr>
    `;try{e&&(e.innerHTML=a),n&&(n.innerHTML=a);const i=new URLSearchParams(this.currentFilters);console.log("📋 Loading appointments with params:",i.toString());const r=await p.get(`/agendamentos?${i.toString()}`);console.log("✅ Appointments loaded:",r),this.appointments=r.agendamentos||[];const l=r.total||this.appointments.length;console.log(`📊 Loaded ${this.appointments.length} appointments (total: ${l})`),this.renderAppointments()}catch(i){console.error("❌ Error loading appointments:",i),console.error("Error details:",(o=i.response)==null?void 0:o.data);const r=`
        <tr><td colspan="9" style="text-align: center; padding: 40px;">
          <div style="color: var(--status-danger);">
            <svg style="width: 48px; height: 48px; margin-bottom: 10px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            <p style="font-weight: 600; margin-bottom: 5px;">Erro ao carregar agendamentos</p>
            <p style="font-size: 0.9rem; color: #666;">${((s=(t=i.response)==null?void 0:t.data)==null?void 0:s.error)||i.message}</p>
            <button class="btn btn-primary" onclick="adminPanel.loadAppointments()" style="margin-top: 15px;">
              Tentar Novamente
            </button>
          </div>
        </td></tr>
      `;e&&(e.innerHTML=r),n&&(n.innerHTML=r)}}renderAppointments(){const e=document.getElementById("dashboardAppointmentsTable"),n=document.getElementById("agendamentosAppointmentsTable"),a=`
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
    `;if(!this.appointments||this.appointments.length===0){e&&(e.innerHTML=a),n&&(n.innerHTML=a);return}console.log(`🎨 Rendering ${this.appointments.length} appointments`);try{const o=this.appointments.map(t=>`
      <tr>
        <td><strong>${t.protocolo}</strong></td>
        <td>
          ${t.cliente_nome}<br>
          <small style="color: #666;">${t.cliente_telefone||"N/A"}</small>
        </td>
        <td>
          ${t.veiculo_marca} ${t.veiculo_modelo}<br>
          <small style="color: #666;">${t.veiculo_placa}</small>
        </td>
        <td>
          ${m(new Date(t.data+"T00:00:00"),"dd/MM/yyyy")}<br>
          <small style="color: #666;">${t.horario}</small>
        </td>
        <td>${this.getTipoLabel(t.tipo_vistoria)}</td>
        <td>${E.currency(t.preco)}</td>
        <td>
          <span class="status-badge ${t.status}">${this.getStatusLabel(t.status)}</span>
        </td>
        <td>
          ${this.getPaymentStatusBadge(t)}
        </td>
        <td>
          <div class="action-buttons">
            <button class="btn btn-primary btn-small" onclick="adminPanel.viewDetails(${t.id})" title="Ver detalhes">
              <svg style="width: 16px; height: 16px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                <circle cx="12" cy="12" r="3"></circle>
              </svg>
            </button>
            <button class="btn btn-success btn-small" onclick="adminPanel.editAppointment(${t.id})" title="Editar">
              <svg style="width: 16px; height: 16px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
              </svg>
            </button>
            ${t.status!=="cancelado"&&t.status!=="realizado"?`
              <button class="btn btn-danger btn-small" onclick="adminPanel.deleteAppointment(${t.id})" title="Excluir">
                <svg style="width: 16px; height: 16px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="3 6 5 6 21 6"></polyline>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                </svg>
              </button>
            `:""}
          </div>
        </td>
      </tr>
    `).join("");e&&(e.innerHTML=o),n&&(n.innerHTML=o),console.log("✅ Table rendered successfully in both Dashboard and Agendamentos sections")}catch(o){console.error("❌ Render error:",o);const t=`
        <tr><td colspan="9" style="text-align: center; padding: 40px;">
          <div style="color: var(--status-danger);">
            <p style="font-weight: 600; margin-bottom: 5px;">Erro ao renderizar agendamentos</p>
            <p style="font-size: 0.9rem; color: #666;">${o.message}</p>
            <button class="btn btn-primary" onclick="adminPanel.loadAppointments()" style="margin-top: 15px;">
              Tentar Novamente
            </button>
          </div>
        </td></tr>
      `;e&&(e.innerHTML=t),n&&(n.innerHTML=t)}}async viewDetails(e){try{const a=(await p.get(`/agendamentos/${e}`)).data,o=document.getElementById("appointmentModal"),t=document.getElementById("appointmentDetails");t.innerHTML=`
        <h2>Detalhes do Agendamento</h2>

        <div class="detail-section">
          <h3>Informações Gerais</h3>
          <div class="detail-row">
            <span class="detail-label">Protocolo:</span>
            <span class="detail-value"><strong>${a.protocolo}</strong></span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Status:</span>
            <span class="detail-value">
              <span class="status-badge ${a.status}">${this.getStatusLabel(a.status)}</span>
            </span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Data de Criação:</span>
            <span class="detail-value">${m(new Date(a.created_at),"dd/MM/yyyy HH:mm")}</span>
          </div>
        </div>

        <div class="detail-section">
          <h3>Cliente</h3>
          <div class="detail-row">
            <span class="detail-label">Nome:</span>
            <span class="detail-value">${a.cliente_nome}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">CPF:</span>
            <span class="detail-value">${a.cliente_cpf}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Telefone:</span>
            <span class="detail-value">${a.cliente_telefone}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">E-mail:</span>
            <span class="detail-value">${a.cliente_email}</span>
          </div>
        </div>

        <div class="detail-section">
          <h3>Veículo</h3>
          <div class="detail-row">
            <span class="detail-label">Placa:</span>
            <span class="detail-value">${a.veiculo_placa}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Marca/Modelo:</span>
            <span class="detail-value">${a.veiculo_marca} ${a.veiculo_modelo}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Ano:</span>
            <span class="detail-value">${a.veiculo_ano}</span>
          </div>
        </div>

        <div class="detail-section">
          <h3>Agendamento</h3>
          <div class="detail-row">
            <span class="detail-label">Tipo:</span>
            <span class="detail-value">${this.getTipoLabel(a.tipo_vistoria)}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Data:</span>
            <span class="detail-value">${m(new Date(a.data+"T00:00:00"),"dd/MM/yyyy")}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Horário:</span>
            <span class="detail-value">${a.horario}</span>
          </div>
          ${a.endereco_vistoria?`
            <div class="detail-row">
              <span class="detail-label">Endereço:</span>
              <span class="detail-value">${a.endereco_vistoria}</span>
            </div>
          `:""}
          <div class="detail-row">
            <span class="detail-label">Valor:</span>
            <span class="detail-value"><strong>${E.currency(a.preco)}</strong></span>
          </div>
        </div>

        ${a.observacoes?`
          <div class="detail-section">
            <h3>Observações</h3>
            <p>${a.observacoes}</p>
          </div>
        `:""}

        <div style="margin-top: 30px; display: flex; gap: 10px; justify-content: center;">
          ${a.status==="pendente"?`
            <button class="btn btn-success" onclick="adminPanel.updateStatus(${a.id}, 'confirmado'); adminPanel.closeModal();">
              Confirmar
            </button>
          `:""}
          ${a.status==="confirmado"?`
            <button class="btn btn-primary" onclick="adminPanel.updateStatus(${a.id}, 'realizado'); adminPanel.closeModal();">
              Marcar como Realizado
            </button>
          `:""}
          ${a.status!=="cancelado"&&a.status!=="realizado"?`
            <button class="btn btn-danger" onclick="adminPanel.updateStatus(${a.id}, 'cancelado'); adminPanel.closeModal();">
              Cancelar
            </button>
          `:""}
          <button class="btn btn-secondary" onclick="adminPanel.closeModal()">Fechar</button>
        </div>
      `,o.style.display="block"}catch(n){console.error("Error loading appointment details:",n),alert("Erro ao carregar detalhes do agendamento")}}async updateStatus(e,n){if(confirm(`Confirmar alteração de status para "${this.getStatusLabel(n)}"?`))try{await p.patch(`/agendamentos/${e}/status`,{status:n}),await this.loadAppointments(),await this.loadStats(),alert("Status atualizado com sucesso!")}catch(a){console.error("Error updating status:",a),alert("Erro ao atualizar status")}}applyFilters(){const e=document.getElementById("filterDate").value,n=document.getElementById("filterStatus").value,a=document.getElementById("filterType").value;this.currentFilters={},e&&(this.currentFilters.data=e),n&&(this.currentFilters.status=n),a&&(this.currentFilters.tipo_vistoria=a),this.loadAppointments()}clearFilters(){document.getElementById("filterDate").value="",document.getElementById("filterStatus").value="",document.getElementById("filterType").value="",this.currentFilters={},this.loadAppointments()}closeModal(){document.getElementById("appointmentModal").style.display="none"}getStatusLabel(e){return{pendente:"Pendente",confirmado:"Confirmado",realizado:"Realizado",cancelado:"Cancelado"}[e]||e}getTipoLabel(e){return{cautelar:"Cautelar",transferencia:"Transferência",outros:"Outros"}[e]||e}getPaymentStatusBadge(e){const n=e.pagamento_status,a=e.pagamento_confirmado;return n==="approved"||a===1?'<span class="payment-badge approved">✓ Pago</span>':n==="pending"?'<span class="payment-badge pending">⏱ Pendente</span>':n==="rejected"||n==="cancelled"?'<span class="payment-badge rejected">✗ Rejeitado</span>':'<span class="payment-badge none">− Sem Pagamento</span>'}setupNewAppointmentModal(){const e=document.getElementById("newAppointmentModal"),n=document.getElementById("btnNovoAgendamento"),a=document.getElementById("closeNewAppointment"),o=document.getElementById("cancelNewAppointment"),t=document.getElementById("newAppointmentForm"),s=document.getElementById("dataAgendamento");document.getElementById("horarioAgendamento"),n.addEventListener("click",()=>{e.style.display="block",this.resetNewAppointmentForm();const i=m(new Date,"yyyy-MM-dd");s.setAttribute("min",i)}),a.addEventListener("click",()=>{e.style.display="none"}),o.addEventListener("click",()=>{e.style.display="none"}),window.addEventListener("click",i=>{i.target===e&&(e.style.display="none")}),s.addEventListener("change",async()=>{await this.loadAvailableTimes(s.value)}),this.applyInputMasks(),t.addEventListener("submit",async i=>{i.preventDefault(),await this.handleNewAppointment()})}applyInputMasks(){const e=document.getElementById("clienteCPF"),n=document.getElementById("clienteTelefone"),a=document.getElementById("veiculoPlaca");e.addEventListener("input",o=>{let t=o.target.value.replace(/\D/g,"");t.length>11&&(t=t.slice(0,11)),t=t.replace(/(\d{3})(\d)/,"$1.$2"),t=t.replace(/(\d{3})(\d)/,"$1.$2"),t=t.replace(/(\d{3})(\d{1,2})$/,"$1-$2"),o.target.value=t}),n.addEventListener("input",o=>{let t=o.target.value.replace(/\D/g,"");t.length>11&&(t=t.slice(0,11)),t=t.replace(/^(\d{2})(\d)/,"($1) $2"),t=t.replace(/(\d{5})(\d)/,"$1-$2"),o.target.value=t}),a.addEventListener("input",o=>{o.target.value=o.target.value.toUpperCase()})}async loadAvailableTimes(e){const n=document.getElementById("horarioAgendamento");try{const o=(await p.get(`/availability/${e}`)).data.slots;n.innerHTML='<option value="">Selecione um horário...</option>',o.forEach(t=>{if(t.available){const s=document.createElement("option");s.value=t.time,s.textContent=`${t.time} (${t.available_slots} vaga${t.available_slots>1?"s":""} disponível)`,n.appendChild(s)}}),o.filter(t=>t.available).length===0&&(n.innerHTML='<option value="">Nenhum horário disponível nesta data</option>')}catch(a){console.error("Error loading available times:",a),n.innerHTML='<option value="">Erro ao carregar horários</option>'}}async handleNewAppointment(){var t,s,i,r;const e=document.getElementById("submitNewAppointment"),n=document.getElementById("submitText"),a=document.getElementById("submitLoading"),o=document.getElementById("newAppointmentError");n.style.display="none",a.style.display="inline-block",e.disabled=!0,o.style.display="none";try{const l={cliente:{nome:document.getElementById("clienteNome").value,cpf:document.getElementById("clienteCPF").value.replace(/\D/g,""),email:document.getElementById("clienteEmail").value,telefone:document.getElementById("clienteTelefone").value.replace(/\D/g,"")},veiculo:{placa:document.getElementById("veiculoPlaca").value,marca:document.getElementById("veiculoMarca").value,modelo:document.getElementById("veiculoModelo").value,ano:parseInt(document.getElementById("veiculoAno").value)},tipo_vistoria:document.getElementById("tipoVistoria").value,data:document.getElementById("dataAgendamento").value,horario:document.getElementById("horarioAgendamento").value,endereco_vistoria:document.getElementById("enderecoVistoria").value||null,observacoes:document.getElementById("observacoes").value||null},c=await p.post("/agendamentos",l);alert(`Agendamento criado com sucesso!
Protocolo: ${c.data.protocolo}`),document.getElementById("newAppointmentModal").style.display="none",this.resetNewAppointmentForm(),await this.loadAppointments(),await this.loadStats()}catch(l){console.error("Error creating appointment:",l);let c="Erro ao criar agendamento. Tente novamente.";(s=(t=l.response)==null?void 0:t.data)!=null&&s.error?c=l.response.data.error:(r=(i=l.response)==null?void 0:i.data)!=null&&r.errors&&(c=l.response.data.errors.map(u=>u.msg).join(", ")),o.textContent=c,o.style.display="block"}finally{n.style.display="inline",a.style.display="none",e.disabled=!1}}resetNewAppointmentForm(){document.getElementById("newAppointmentForm").reset(),document.getElementById("newAppointmentError").style.display="none",document.getElementById("horarioAgendamento").innerHTML='<option value="">Selecione primeiro a data...</option>'}async editAppointment(e){try{const a=(await p.get(`/agendamentos/${e}`)).data,o=document.getElementById("editAppointmentModal");o.style.display="block",document.getElementById("editAppointmentId").value=a.id,document.getElementById("editStatus").value=a.status,document.getElementById("editAgendamentoClienteNome").value=a.cliente_nome,document.getElementById("editAgendamentoClienteCPF").value=this.formatCPF(a.cliente_cpf),document.getElementById("editAgendamentoClienteEmail").value=a.cliente_email,document.getElementById("editAgendamentoClienteTelefone").value=this.formatTelefone(a.cliente_telefone),document.getElementById("editVeiculoPlaca").value=a.veiculo_placa,document.getElementById("editVeiculoMarca").value=a.veiculo_marca,document.getElementById("editVeiculoModelo").value=a.veiculo_modelo,document.getElementById("editVeiculoAno").value=a.veiculo_ano,document.getElementById("editTipoVistoria").value=a.tipo_vistoria,document.getElementById("editDataAgendamento").value=a.data,document.getElementById("editHorarioAgendamento").value=a.horario,document.getElementById("editPreco").value=(a.preco/100).toFixed(2),document.getElementById("editEnderecoVistoria").value=a.endereco_vistoria||"",document.getElementById("editObservacoes").value=a.observacoes||"",this.editModalSetup||(this.setupEditAppointmentModal(),this.editModalSetup=!0)}catch(n){console.error("Error loading appointment for edit:",n),alert("Erro ao carregar dados do agendamento")}}setupEditAppointmentModal(){const e=document.getElementById("editAppointmentModal"),n=document.getElementById("closeEditAppointment"),a=document.getElementById("cancelEditAppointment"),o=document.getElementById("editAppointmentForm");n.addEventListener("click",()=>{e.style.display="none"}),a.addEventListener("click",()=>{e.style.display="none"}),window.addEventListener("click",t=>{t.target===e&&(e.style.display="none")}),this.applyEditInputMasks(),o.addEventListener("submit",async t=>{t.preventDefault(),await this.handleEditAppointment()})}applyEditInputMasks(){const e=document.getElementById("editAgendamentoClienteCPF"),n=document.getElementById("editAgendamentoClienteTelefone"),a=document.getElementById("editVeiculoPlaca");e.addEventListener("input",o=>{let t=o.target.value.replace(/\D/g,"");t.length>11&&(t=t.slice(0,11)),t=t.replace(/(\d{3})(\d)/,"$1.$2"),t=t.replace(/(\d{3})(\d)/,"$1.$2"),t=t.replace(/(\d{3})(\d{1,2})$/,"$1-$2"),o.target.value=t}),n.addEventListener("input",o=>{let t=o.target.value.replace(/\D/g,"");t.length>11&&(t=t.slice(0,11)),t=t.replace(/^(\d{2})(\d)/,"($1) $2"),t=t.replace(/(\d{5})(\d)/,"$1-$2"),o.target.value=t}),a.addEventListener("input",o=>{o.target.value=o.target.value.toUpperCase()})}async handleEditAppointment(){var t,s,i,r;const e=document.getElementById("submitEditAppointment"),n=document.getElementById("editSubmitText"),a=document.getElementById("editSubmitLoading"),o=document.getElementById("editAppointmentError");n.style.display="none",a.style.display="inline-block",e.disabled=!0,o.style.display="none";try{const l=document.getElementById("editAppointmentId").value,c={status:document.getElementById("editStatus").value,cliente_nome:document.getElementById("editAgendamentoClienteNome").value,cliente_cpf:document.getElementById("editAgendamentoClienteCPF").value.replace(/\D/g,""),cliente_email:document.getElementById("editAgendamentoClienteEmail").value,cliente_telefone:document.getElementById("editAgendamentoClienteTelefone").value.replace(/\D/g,""),veiculo_placa:document.getElementById("editVeiculoPlaca").value,veiculo_marca:document.getElementById("editVeiculoMarca").value,veiculo_modelo:document.getElementById("editVeiculoModelo").value,veiculo_ano:parseInt(document.getElementById("editVeiculoAno").value),tipo_vistoria:document.getElementById("editTipoVistoria").value,data:document.getElementById("editDataAgendamento").value,horario:document.getElementById("editHorarioAgendamento").value,preco:Math.round(parseFloat(document.getElementById("editPreco").value)*100),endereco_vistoria:document.getElementById("editEnderecoVistoria").value||null,observacoes:document.getElementById("editObservacoes").value||null};await p.put(`/agendamentos/${l}`,c),alert("Agendamento atualizado com sucesso!"),document.getElementById("editAppointmentModal").style.display="none",await this.loadAppointments(),await this.loadStats()}catch(l){console.error("Error updating appointment:",l);let c="Erro ao atualizar agendamento. Tente novamente.";(s=(t=l.response)==null?void 0:t.data)!=null&&s.error?c=l.response.data.error:(r=(i=l.response)==null?void 0:i.data)!=null&&r.errors&&(c=l.response.data.errors.map(u=>u.msg).join(", ")),o.textContent=c,o.style.display="block"}finally{n.style.display="inline",a.style.display="none",e.disabled=!1}}async deleteAppointment(e){if(confirm("Tem certeza que deseja excluir este agendamento? Esta ação não pode ser desfeita."))try{await p.delete(`/agendamentos/${e}`),alert("Agendamento excluído com sucesso!"),await this.loadAppointments(),await this.loadStats()}catch(n){console.error("Error deleting appointment:",n),alert("Erro ao excluir agendamento")}}formatCPF(e){return e?e.replace(/\D/g,"").replace(/(\d{3})(\d{3})(\d{3})(\d{2})/,"$1.$2.$3-$4"):""}formatTelefone(e){if(!e)return"";const n=e.replace(/\D/g,"");return n.length===11?n.replace(/(\d{2})(\d{5})(\d{4})/,"($1) $2-$3"):n.length===10?n.replace(/(\d{2})(\d{4})(\d{4})/,"($1) $2-$3"):e}async loadClientes(){var a,o;const e=document.getElementById("clientesTable"),n=`
      <tr>
        <td colspan="6" style="text-align: center; padding: 40px;">
          <div class="spinner"></div>
          <p style="margin-top: 10px; color: #666;">Carregando clientes...</p>
        </td>
      </tr>
    `;try{e&&(e.innerHTML=n),console.log("📋 Loading clientes...");const t=await p.get("/clientes");console.log("✅ Clientes loaded:",t),this.clientes=t.clientes||[],console.log(`📊 Loaded ${this.clientes.length} clientes (total: ${t.total})`),this.renderClientes()}catch(t){console.error("❌ Error loading clientes:",t);const s=`
        <tr><td colspan="6" style="text-align: center; padding: 40px;">
          <div style="color: var(--status-danger);">
            <svg style="width: 48px; height: 48px; margin-bottom: 10px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            <p style="font-weight: 600; margin-bottom: 5px;">Erro ao carregar clientes</p>
            <p style="font-size: 0.9rem; color: #666;">${((o=(a=t.response)==null?void 0:a.data)==null?void 0:o.error)||t.message}</p>
            <button class="btn btn-primary" onclick="adminPanel.loadClientes()" style="margin-top: 15px;">
              Tentar Novamente
            </button>
          </div>
        </td></tr>
      `;e&&(e.innerHTML=s)}}renderClientes(){const e=document.getElementById("clientesTable"),n=`
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
    `;if(!this.clientes||this.clientes.length===0){e&&(e.innerHTML=n);return}console.log(`🎨 Rendering ${this.clientes.length} clientes`);try{const a=this.clientes.map(o=>`
        <tr>
          <td><strong>${o.nome}</strong></td>
          <td>${this.formatCPF(o.cpf)}</td>
          <td>${this.formatTelefone(o.telefone)}</td>
          <td>${o.email||"-"}</td>
          <td>${m(new Date(o.created_at),"dd/MM/yyyy")}</td>
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
      `).join("");e&&(e.innerHTML=a),console.log("✅ Clientes table rendered successfully")}catch(a){console.error("❌ Render error:",a);const o=`
        <tr><td colspan="6" style="text-align: center; padding: 40px;">
          <div style="color: var(--status-danger);">
            <p style="font-weight: 600; margin-bottom: 5px;">Erro ao renderizar clientes</p>
            <p style="font-size: 0.9rem; color: #666;">${a.message}</p>
            <button class="btn btn-primary" onclick="adminPanel.loadClientes()" style="margin-top: 15px;">
              Tentar Novamente
            </button>
          </div>
        </td></tr>
      `;e&&(e.innerHTML=o)}}setupNewClienteModal(){const e=document.getElementById("newClienteModal"),n=document.getElementById("btnNovoCliente"),a=document.getElementById("closeNewCliente"),o=document.getElementById("cancelNewCliente"),t=document.getElementById("newClienteForm");n.addEventListener("click",()=>{e.style.display="block",this.resetNewClienteForm()}),a.addEventListener("click",()=>{e.style.display="none"}),o.addEventListener("click",()=>{e.style.display="none"}),window.addEventListener("click",s=>{s.target===e&&(e.style.display="none")}),this.applyClienteMasks("new"),t.addEventListener("submit",async s=>{s.preventDefault(),await this.handleNewCliente()})}applyClienteMasks(e){const n=document.getElementById(`${e}ClienteCPF`),a=document.getElementById(`${e}ClienteTelefone`);n.addEventListener("input",o=>{let t=o.target.value.replace(/\D/g,"");t.length>11&&(t=t.slice(0,11)),t=t.replace(/(\d{3})(\d)/,"$1.$2"),t=t.replace(/(\d{3})(\d)/,"$1.$2"),t=t.replace(/(\d{3})(\d{1,2})$/,"$1-$2"),o.target.value=t}),a.addEventListener("input",o=>{let t=o.target.value.replace(/\D/g,"");t.length>11&&(t=t.slice(0,11)),t=t.replace(/^(\d{2})(\d)/,"($1) $2"),t=t.replace(/(\d{5})(\d)/,"$1-$2"),o.target.value=t})}async handleNewCliente(){var t,s;const e=document.getElementById("submitNewCliente"),n=document.getElementById("newClienteSubmitText"),a=document.getElementById("newClienteSubmitLoading"),o=document.getElementById("newClienteError");n.style.display="none",a.style.display="inline-block",e.disabled=!0,o.style.display="none";try{const i={nome:document.getElementById("newClienteNome").value,cpf:document.getElementById("newClienteCPF").value.replace(/\D/g,""),telefone:document.getElementById("newClienteTelefone").value.replace(/\D/g,""),email:document.getElementById("newClienteEmail").value||null};await p.post("/clientes",i),alert("Cliente cadastrado com sucesso!"),document.getElementById("newClienteModal").style.display="none",this.resetNewClienteForm(),await this.loadClientes()}catch(i){console.error("Error creating cliente:",i);let r="Erro ao cadastrar cliente. Tente novamente.";(s=(t=i.response)==null?void 0:t.data)!=null&&s.error&&(r=i.response.data.error),o.textContent=r,o.style.display="block"}finally{n.style.display="inline",a.style.display="none",e.disabled=!1}}resetNewClienteForm(){document.getElementById("newClienteForm").reset(),document.getElementById("newClienteError").style.display="none"}async editCliente(e){try{const a=(await p.get(`/clientes/${e}`)).data,o=document.getElementById("editClienteModal");o.style.display="block",document.getElementById("editClienteId").value=a.id,document.getElementById("editClienteNome").value=a.nome,document.getElementById("editClienteCPF").value=this.formatCPF(a.cpf),document.getElementById("editClienteTelefone").value=this.formatTelefone(a.telefone),document.getElementById("editClienteEmail").value=a.email||"",this.editClienteModalSetup||(this.setupEditClienteModal(),this.editClienteModalSetup=!0)}catch(n){console.error("Error loading cliente for edit:",n),alert("Erro ao carregar dados do cliente")}}setupEditClienteModal(){const e=document.getElementById("editClienteModal"),n=document.getElementById("closeEditCliente"),a=document.getElementById("cancelEditCliente"),o=document.getElementById("editClienteForm");n.addEventListener("click",()=>{e.style.display="none"}),a.addEventListener("click",()=>{e.style.display="none"}),window.addEventListener("click",t=>{t.target===e&&(e.style.display="none")}),this.applyClienteMasks("edit"),o.addEventListener("submit",async t=>{t.preventDefault(),await this.handleEditCliente()})}async handleEditCliente(){var t,s;const e=document.getElementById("submitEditCliente"),n=document.getElementById("editClienteSubmitText"),a=document.getElementById("editClienteSubmitLoading"),o=document.getElementById("editClienteError");n.style.display="none",a.style.display="inline-block",e.disabled=!0,o.style.display="none";try{const i=document.getElementById("editClienteId").value,r={nome:document.getElementById("editClienteNome").value,telefone:document.getElementById("editClienteTelefone").value.replace(/\D/g,""),email:document.getElementById("editClienteEmail").value||null};await p.put(`/clientes/${i}`,r),alert("Cliente atualizado com sucesso!"),document.getElementById("editClienteModal").style.display="none",await this.loadClientes()}catch(i){console.error("Error updating cliente:",i);let r="Erro ao atualizar cliente. Tente novamente.";(s=(t=i.response)==null?void 0:t.data)!=null&&s.error&&(r=i.response.data.error),o.textContent=r,o.style.display="block"}finally{n.style.display="inline",a.style.display="none",e.disabled=!1}}async deleteCliente(e){if(confirm("Tem certeza que deseja excluir este cliente? Esta ação não pode ser desfeita."))try{await p.delete(`/clientes/${e}`),alert("Cliente excluído com sucesso!"),await this.loadClientes()}catch(n){console.error("Error deleting cliente:",n),alert("Erro ao excluir cliente")}}async loadConfiguracoes(){try{console.log("📋 Loading configuracoes...");const e=await p.get("/config");console.log("✅ Configuracoes loaded:",e);const n=e.horario_inicio||"08:00",a=e.horario_fim||"18:00";document.getElementById("horarioInicio").value=n,document.getElementById("horarioFim").value=a;const o=(parseInt(e.preco_cautelar||15e3)/100).toFixed(2),t=(parseInt(e.preco_transferencia||12e3)/100).toFixed(2),s=(parseInt(e.preco_outros||1e4)/100).toFixed(2);document.getElementById("precoCautelar").value=o,document.getElementById("precoTransferencia").value=t,document.getElementById("precoOutros").value=s;const i=e.notificacao_email_confirmacao==="true"||e.notificacao_email_confirmacao===!0,r=e.notificacao_lembrete_24h==="true"||e.notificacao_lembrete_24h===!0;document.getElementById("notifEmailConfirmacao").checked=i,document.getElementById("notifLembrete24h").checked=r,console.log("✅ Configuracoes preenchidas no formulário")}catch(e){console.error("❌ Error loading configuracoes:",e),alert("Erro ao carregar configurações")}}setupConfiguracoes(){const e=document.getElementById("btnSalvarHorarios");e&&e.addEventListener("click",()=>this.saveHorarios());const n=document.getElementById("btnSalvarPrecos");n&&n.addEventListener("click",()=>this.savePrecos());const a=document.getElementById("btnSalvarNotificacoes");a&&a.addEventListener("click",()=>this.saveNotificacoes())}async saveHorarios(){const e=document.getElementById("horarioInicio").value,n=document.getElementById("horarioFim").value;if(!e||!n){alert("Preencha todos os campos de horário");return}try{const a={horario_inicio:e,horario_fim:n};console.log("💾 Salvando horários:",a),await p.put("/config",a),alert("Horários salvos com sucesso!")}catch(a){console.error("❌ Error saving horarios:",a),alert("Erro ao salvar horários")}}async savePrecos(){const e=parseFloat(document.getElementById("precoCautelar").value),n=parseFloat(document.getElementById("precoTransferencia").value),a=parseFloat(document.getElementById("precoOutros").value);if(isNaN(e)||isNaN(n)||isNaN(a)){alert("Preencha todos os campos de preço com valores válidos");return}try{const o={preco_cautelar:Math.round(e*100).toString(),preco_transferencia:Math.round(n*100).toString(),preco_outros:Math.round(a*100).toString()};console.log("💾 Salvando preços:",o),await p.put("/config",o),alert("Preços salvos com sucesso!")}catch(o){console.error("❌ Error saving precos:",o),alert("Erro ao salvar preços")}}async saveNotificacoes(){const e=document.getElementById("notifEmailConfirmacao").checked,n=document.getElementById("notifLembrete24h").checked;try{const a={notificacao_email_confirmacao:e.toString(),notificacao_lembrete_24h:n.toString()};console.log("💾 Salvando notificações:",a),await p.put("/config",a),alert("Configurações de notificação salvadas com sucesso!")}catch(a){console.error("❌ Error saving notificacoes:",a),alert("Erro ao salvar configurações de notificação")}}async setupCalendar(){const e=document.getElementById("prevMonthBtn"),n=document.getElementById("nextMonthBtn");e&&n&&(e.addEventListener("click",()=>{this.currentCalendarDate.setMonth(this.currentCalendarDate.getMonth()-1),this.renderCalendar()}),n.addEventListener("click",()=>{this.currentCalendarDate.setMonth(this.currentCalendarDate.getMonth()+1),this.renderCalendar()}))}async renderCalendar(){if(this.calendarSetup||(await this.setupCalendar(),this.calendarSetup=!0),!this.appointments||this.appointments.length===0){const y=new Date(this.currentCalendarDate.getFullYear(),this.currentCalendarDate.getMonth(),1),f=new Date(this.currentCalendarDate.getFullYear(),this.currentCalendarDate.getMonth()+1,0);try{const b=await p.get(`/agendamentos?data_inicio=${m(y,"yyyy-MM-dd")}&data_fim=${m(f,"yyyy-MM-dd")}`);this.appointments=b.data.agendamentos||[]}catch(b){console.error("Error loading appointments for calendar:",b),this.appointments=[]}}const e=document.getElementById("currentMonthLabel"),n=["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];e.textContent=`${n[this.currentCalendarDate.getMonth()]} ${this.currentCalendarDate.getFullYear()}`;const a=document.getElementById("calendarGrid"),o=a.querySelectorAll(".calendar-day-header");a.innerHTML="",o.forEach(y=>a.appendChild(y));const t=this.currentCalendarDate.getFullYear(),s=this.currentCalendarDate.getMonth(),i=new Date(t,s,1),r=new Date(t,s+1,0),l=i.getDay(),c=r.getDate(),u=new Date(t,s,0).getDate(),g=l,v=Math.ceil((c+l)/7)*7-(c+l),C=new Date;C.setHours(0,0,0,0);for(let y=g-1;y>=0;y--){const f=u-y,b=this.createCalendarDay(f,!0,new Date(t,s-1,f));a.appendChild(b)}for(let y=1;y<=c;y++){const f=new Date(t,s,y);f.setHours(0,0,0,0);const b=f.getTime()===C.getTime(),R=this.createCalendarDay(y,!1,f,b);a.appendChild(R)}for(let y=1;y<=v;y++){const f=this.createCalendarDay(y,!0,new Date(t,s+1,y));a.appendChild(f)}}createCalendarDay(e,n,a,o=!1){const t=document.createElement("div");t.className="calendar-day",n&&t.classList.add("other-month"),o&&t.classList.add("today");const s=document.createElement("div");s.className="day-number",s.textContent=e,t.appendChild(s);const i=m(a,"yyyy-MM-dd"),r=this.appointments.filter(l=>l.data===i);if(r.length>0&&!n){if(t.classList.add("has-appointments"),r.length>3){const u=document.createElement("div");u.className="appointment-count",u.textContent=r.length,t.appendChild(u)}const l=document.createElement("div");l.className="day-appointments",r.slice(0,3).forEach(u=>{const g=document.createElement("div");g.className=`calendar-appointment ${u.status}`,g.textContent=`${u.horario} - ${u.cliente_nome.split(" ")[0]}`,g.title=`${u.horario} - ${u.cliente_nome}
${u.veiculo_placa} - ${this.getStatusLabel(u.status)}`,g.addEventListener("click",h=>{h.stopPropagation(),this.viewDetails(u.id)}),l.appendChild(g)}),t.appendChild(l)}return n||t.addEventListener("click",()=>{const l=document.getElementById("newAppointmentModal");l.style.display="block",this.resetNewAppointmentForm(),document.getElementById("dataAgendamento").value=i,document.getElementById("dataAgendamento").dispatchEvent(new Event("change"));const c=m(new Date,"yyyy-MM-dd");document.getElementById("dataAgendamento").setAttribute("min",c)}),t}setupNotifications(){const e=document.getElementById("notificationsBtn"),n=document.getElementById("notificationsDropdown"),a=document.getElementById("closeNotifications");e.addEventListener("click",o=>{o.stopPropagation(),n.style.display==="flex"?n.style.display="none":(n.style.display="flex",this.loadNotifications())}),a.addEventListener("click",()=>{n.style.display="none"}),document.addEventListener("click",o=>{!e.contains(o.target)&&!n.contains(o.target)&&(n.style.display="none")}),this.loadNotificationCounts(),setInterval(()=>{this.loadNotificationCounts()},3e4)}async loadNotifications(){const e=document.getElementById("notificationsList");e.innerHTML=`
      <div class="notifications-loading">
        <div class="spinner"></div>
        <p>Carregando notificações...</p>
      </div>
    `;try{const n=await p.get("/notifications"),{notifications:a,unreadCount:o}=n,t=document.getElementById("notificationBadge");o>0?(t.textContent=o,t.style.display="block"):t.style.display="none",a.length===0?e.innerHTML=`
          <div class="notifications-empty">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
            </svg>
            <p>Nenhuma notificação</p>
          </div>
        `:(e.innerHTML=a.map(s=>`
          <div class="notification-item ${s.read?"":"unread"}" data-section="${s.section}">
            <div class="notification-header">
              <span class="notification-title">${s.title}</span>
              <span class="notification-time">${this.formatNotificationTime(s.time)}</span>
            </div>
            <div class="notification-message">${s.message}</div>
            <span class="notification-type-badge ${s.type}">${this.getTypeLabel(s.type)}</span>
          </div>
        `).join(""),e.querySelectorAll(".notification-item").forEach(s=>{s.addEventListener("click",()=>{const i=s.dataset.section;notificationsDropdown.style.display="none";const r=document.querySelector(`.nav-item[data-section="${i}"]`);r&&r.click()})}))}catch(n){console.error("Error loading notifications:",n),e.innerHTML=`
        <div class="notifications-empty">
          <p style="color: var(--status-danger);">Erro ao carregar notificações</p>
        </div>
      `}}async loadNotificationCounts(){try{const e=await p.get("/notifications/counts");Object.keys(e).forEach(o=>{const t=document.getElementById(`badge-${o}`);if(t){const s=e[o];s>0?(t.textContent=s,t.style.display="inline-block"):t.style.display="none"}});const n=Object.values(e).reduce((o,t)=>o+t,0),a=document.getElementById("notificationBadge");n>0?(a.textContent=n,a.style.display="block"):a.style.display="none"}catch(e){console.error("Error loading notification counts:",e)}}formatNotificationTime(e){const n=new Date(e),o=new Date-n,t=Math.floor(o/6e4),s=Math.floor(o/36e5),i=Math.floor(o/864e5);return t<1?"agora":t<60?`${t}m atrás`:s<24?`${s}h atrás`:i===1?"ontem":i<7?`${i}d atrás`:m(n,"dd/MM/yyyy")}getTypeLabel(e){return{agendamento:"Novo",agendamento_hoje:"Hoje",novo_cliente:"Cliente"}[e]||e}initCharts(){this.createRevenueChart(),this.createStatusChart()}async createRevenueChart(){const e=document.getElementById("revenueChart");if(!e)return;const n=[],a=[],o=new Date;for(let t=5;t>=0;t--){const s=new Date(o.getFullYear(),o.getMonth()-t,1),i=m(s,"yyyy-MM-dd"),r=m(new Date(s.getFullYear(),s.getMonth()+1,0),"yyyy-MM-dd");n.push(m(s,"MMM"));try{const l=await p.get(`/agendamentos/stats?data_inicio=${i}&data_fim=${r}`);a.push((l.receita_realizada||0)/100)}catch{a.push(0)}}this.revenueChart&&this.revenueChart.destroy(),this.revenueChart=new Chart(e,{type:"line",data:{labels:n,datasets:[{label:"Receita (R$)",data:a,borderColor:"#ed6a2b",backgroundColor:"rgba(237, 106, 43, 0.1)",borderWidth:3,tension:.4,fill:!0,pointRadius:6,pointHoverRadius:8,pointBackgroundColor:"#ed6a2b",pointBorderColor:"#fff",pointBorderWidth:2,pointHoverBackgroundColor:"#d85a1b",pointHoverBorderWidth:3}]},options:{responsive:!0,maintainAspectRatio:!1,plugins:{legend:{display:!0,position:"bottom",labels:{font:{size:12,weight:"600",family:"'Inter', sans-serif"},padding:15,usePointStyle:!0,pointStyle:"circle"}},tooltip:{backgroundColor:"rgba(0, 0, 0, 0.8)",titleFont:{size:14,weight:"bold"},bodyFont:{size:13},padding:12,cornerRadius:8,displayColors:!1,callbacks:{label:function(t){return"R$ "+t.parsed.y.toFixed(2)}}}},scales:{y:{beginAtZero:!0,ticks:{callback:function(t){return"R$ "+t.toFixed(0)},font:{size:11,weight:"500"},color:"#64748b"},grid:{color:"rgba(0, 0, 0, 0.05)",drawBorder:!1}},x:{ticks:{font:{size:11,weight:"600"},color:"#475569"},grid:{display:!1}}}}})}async createStatusChart(){const e=document.getElementById("statusChart");if(!e)return;const n=new Date,a=m(new Date(n.getFullYear(),n.getMonth(),1),"yyyy-MM-dd"),o=m(new Date(n.getFullYear(),n.getMonth()+1,0),"yyyy-MM-dd");try{const t=await p.get(`/agendamentos/stats?data_inicio=${a}&data_fim=${o}`);this.statusChart&&this.statusChart.destroy(),this.statusChart=new Chart(e,{type:"doughnut",data:{labels:["Pendentes","Confirmados","Realizados","Cancelados"],datasets:[{data:[t.pendentes||0,t.confirmados||0,t.realizados||0,t.cancelados||0],backgroundColor:["rgba(251, 191, 36, 0.8)","rgba(59, 130, 246, 0.8)","rgba(34, 197, 94, 0.8)","rgba(239, 68, 68, 0.8)"],borderColor:["#fbbf24","#3b82f6","#22c55e","#ef4444"],borderWidth:2,hoverOffset:15}]},options:{responsive:!0,maintainAspectRatio:!1,plugins:{legend:{position:"bottom",labels:{font:{size:12,weight:"600",family:"'Inter', sans-serif"},padding:15,usePointStyle:!0,pointStyle:"circle"}},tooltip:{backgroundColor:"rgba(0, 0, 0, 0.8)",titleFont:{size:14,weight:"bold"},bodyFont:{size:13},padding:12,cornerRadius:8,displayColors:!0,callbacks:{label:function(s){const i=s.label||"",r=s.parsed||0,l=s.dataset.data.reduce((u,g)=>u+g,0),c=l>0?(r/l*100).toFixed(1):0;return i+": "+r+" ("+c+"%)"}}}},cutout:"65%"}})}catch(t){console.error("Error creating status chart:",t)}}showChartDetail(e){document.querySelectorAll(".content-section").forEach(t=>t.classList.remove("active"));const a=e==="revenue"?"revenue-detail":"status-detail",o=document.getElementById(`section-${a}`);o&&o.classList.add("active"),e==="revenue"?this.renderRevenueDetail():e==="status"&&this.renderStatusDetail()}async renderRevenueDetail(){const e=document.getElementById("revenueDetailContent");e&&(e.innerHTML=`
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
    `,await this.loadRevenueDetailCharts())}async loadRevenueDetailCharts(){const e=new Date,n=[],a=[];let o=0,t={name:"",value:0};for(let r=11;r>=0;r--){const l=new Date(e.getFullYear(),e.getMonth()-r,1),c=m(l,"yyyy-MM-dd"),u=m(new Date(l.getFullYear(),l.getMonth()+1,0),"yyyy-MM-dd");n.push(m(l,"MMM"));try{const h=((await p.get(`/agendamentos/stats?data_inicio=${c}&data_fim=${u}`)).receita_realizada||0)/100;a.push(h),o+=h,h>t.value&&(t={name:m(l,"MMM/yy"),value:h})}catch{a.push(0)}}const s=a.slice(-6).reduce((r,l)=>r+l,0);document.getElementById("totalRevenue6m").textContent=E.currency(s*100),document.getElementById("avgRevenueMonth").textContent=E.currency(s/6*100),document.getElementById("bestMonth").textContent=`${t.name} (${E.currency(t.value*100)})`;const i=a.length>=2?((a[a.length-1]-a[a.length-2])/a[a.length-2]*100).toFixed(1):0;document.getElementById("revenueGrowth").textContent=`${i>0?"+":""}${i}%`,this.createRevenueTrendChart(n,a),this.createRevenueByTypeChart(),this.createMonthlyComparisonChart(),this.createDailyRevenueChart()}createRevenueTrendChart(e,n){const a=document.getElementById("revenueTrendChart");a&&new Chart(a,{type:"line",data:{labels:e,datasets:[{label:"Receita (R$)",data:n,borderColor:"#ed6a2b",backgroundColor:"rgba(237, 106, 43, 0.1)",borderWidth:3,tension:.4,fill:!0,pointRadius:5,pointHoverRadius:7}]},options:{responsive:!0,maintainAspectRatio:!1,plugins:{legend:{display:!0,position:"top"},tooltip:{backgroundColor:"rgba(0, 0, 0, 0.8)",padding:12,cornerRadius:8,callbacks:{label:o=>"R$ "+o.parsed.y.toFixed(2)}}},scales:{y:{beginAtZero:!0,ticks:{callback:o=>"R$ "+o.toFixed(0)}}}}})}async createRevenueByTypeChart(){const e=document.getElementById("revenueByTypeChart");if(!e)return;const n=m(new Date(new Date().getFullYear(),0,1),"yyyy-MM-dd"),a=m(new Date(new Date().getFullYear(),11,31),"yyyy-MM-dd");try{const o=await p.get(`/agendamentos?data_inicio=${n}&data_fim=${a}`),t={cautelar:0,transferencia:0,outros:0};o.agendamentos.forEach(s=>{s.status==="realizado"&&s.preco&&(t[s.tipo_vistoria]=(t[s.tipo_vistoria]||0)+s.preco/100)}),new Chart(e,{type:"doughnut",data:{labels:["Cautelar","Transferência","Outros"],datasets:[{data:[t.cautelar,t.transferencia,t.outros],backgroundColor:["#ed6a2b","#3b82f6","#22c55e"],borderWidth:2}]},options:{responsive:!0,maintainAspectRatio:!1,plugins:{legend:{position:"bottom"},tooltip:{callbacks:{label:s=>{const i=s.label||"",r=s.parsed||0;return i+": R$ "+r.toFixed(2)}}}},cutout:"60%"}})}catch(o){console.error("Error creating revenue by type chart:",o)}}async createMonthlyComparisonChart(){const e=document.getElementById("monthlyComparisonChart");if(!e)return;const n=new Date,a=new Date(n.getFullYear(),n.getMonth(),1),o=new Date(n.getFullYear(),n.getMonth()-1,1);try{const[t,s]=await Promise.all([p.get(`/agendamentos/stats?data_inicio=${m(a,"yyyy-MM-dd")}&data_fim=${m(new Date(n.getFullYear(),n.getMonth()+1,0),"yyyy-MM-dd")}`),p.get(`/agendamentos/stats?data_inicio=${m(o,"yyyy-MM-dd")}&data_fim=${m(new Date(n.getFullYear(),n.getMonth(),0),"yyyy-MM-dd")}`)]);new Chart(e,{type:"bar",data:{labels:["Mês Anterior","Mês Atual"],datasets:[{label:"Receita Realizada",data:[(s.receita_realizada||0)/100,(t.receita_realizada||0)/100],backgroundColor:["#94a3b8","#ed6a2b"],borderRadius:8}]},options:{responsive:!0,maintainAspectRatio:!1,plugins:{legend:{display:!1},tooltip:{callbacks:{label:i=>"R$ "+i.parsed.y.toFixed(2)}}},scales:{y:{beginAtZero:!0,ticks:{callback:i=>"R$ "+i.toFixed(0)}}}}})}catch(t){console.error("Error creating monthly comparison chart:",t)}}async createDailyRevenueChart(){const e=document.getElementById("dailyRevenueChart");if(!e)return;const n=new Date,a=m(new Date(n.getFullYear(),n.getMonth(),1),"yyyy-MM-dd"),o=m(new Date(n.getFullYear(),n.getMonth()+1,0),"yyyy-MM-dd");try{const t=await p.get(`/agendamentos?data_inicio=${a}&data_fim=${o}`),s={};t.agendamentos.forEach(l=>{l.status==="realizado"&&l.preco&&(s[l.data]=(s[l.data]||0)+l.preco/100)});const i=Object.keys(s).sort(),r=i.map(l=>s[l]);new Chart(e,{type:"bar",data:{labels:i.map(l=>m(new Date(l+"T00:00:00"),"dd/MM")),datasets:[{label:"Receita Diária (R$)",data:r,backgroundColor:"#ed6a2b",borderRadius:6}]},options:{responsive:!0,maintainAspectRatio:!1,plugins:{legend:{display:!0,position:"top"},tooltip:{callbacks:{label:l=>"R$ "+l.parsed.y.toFixed(2)}}},scales:{y:{beginAtZero:!0,ticks:{callback:l=>"R$ "+l.toFixed(0)}}}}})}catch(t){console.error("Error creating daily revenue chart:",t)}}async renderStatusDetail(){const e=document.getElementById("statusDetailContent");e&&(e.innerHTML=`
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
    `,await this.loadStatusDetailCharts())}async loadStatusDetailCharts(){const e=new Date,n=m(new Date(e.getFullYear(),0,1),"yyyy-MM-dd"),a=m(new Date(e.getFullYear(),11,31),"yyyy-MM-dd");try{const o=await p.get(`/agendamentos?data_inicio=${n}&data_fim=${a}`),t={pendente:0,confirmado:0,realizado:0,cancelado:0};o.agendamentos.forEach(r=>{t[r.status]=(t[r.status]||0)+1});const s=o.total||0,i=s>0?(t.cancelado/s*100).toFixed(1):0;document.getElementById("totalPendentes").textContent=t.pendente,document.getElementById("totalConfirmados").textContent=t.confirmado,document.getElementById("totalRealizados").textContent=t.realizado,document.getElementById("taxaCancelamento").textContent=`${i}%`,this.createStatusEvolutionChart(),this.createCompletionRateChart(t,s),this.createStatusByTypeChart(),this.createWeeklyStatusChart()}catch(o){console.error("Error loading status detail charts:",o)}}async createStatusEvolutionChart(){const e=document.getElementById("statusEvolutionChart");if(!e)return;const n=new Date,a=[],o=[],t=[],s=[],i=[];for(let r=5;r>=0;r--){const l=new Date(n.getFullYear(),n.getMonth()-r,1),c=m(l,"yyyy-MM-dd"),u=m(new Date(l.getFullYear(),l.getMonth()+1,0),"yyyy-MM-dd");a.push(m(l,"MMM"));try{const g=await p.get(`/agendamentos/stats?data_inicio=${c}&data_fim=${u}`);o.push(g.pendentes||0),t.push(g.confirmados||0),s.push(g.realizados||0),i.push(g.cancelados||0)}catch{o.push(0),t.push(0),s.push(0),i.push(0)}}new Chart(e,{type:"line",data:{labels:a,datasets:[{label:"Pendentes",data:o,borderColor:"#fbbf24",backgroundColor:"rgba(251, 191, 36, 0.1)",tension:.4},{label:"Confirmados",data:t,borderColor:"#3b82f6",backgroundColor:"rgba(59, 130, 246, 0.1)",tension:.4},{label:"Realizados",data:s,borderColor:"#22c55e",backgroundColor:"rgba(34, 197, 94, 0.1)",tension:.4},{label:"Cancelados",data:i,borderColor:"#ef4444",backgroundColor:"rgba(239, 68, 68, 0.1)",tension:.4}]},options:{responsive:!0,maintainAspectRatio:!1,plugins:{legend:{display:!0,position:"top"}},scales:{y:{beginAtZero:!0}}}})}createCompletionRateChart(e,n){const a=document.getElementById("completionRateChart");a&&(n>0&&(e.realizado/n*100).toFixed(1),new Chart(a,{type:"doughnut",data:{labels:["Realizados","Não Realizados"],datasets:[{data:[e.realizado,n-e.realizado],backgroundColor:["#22c55e","#e5e7eb"],borderWidth:0}]},options:{responsive:!0,maintainAspectRatio:!1,plugins:{legend:{position:"bottom"},tooltip:{callbacks:{label:o=>{const t=o.label||"",s=o.parsed||0,i=n>0?(s/n*100).toFixed(1):0;return t+": "+s+" ("+i+"%)"}}}},cutout:"70%"}}))}async createStatusByTypeChart(){const e=document.getElementById("statusByTypeChart");if(!e)return;const n=new Date,a=m(new Date(n.getFullYear(),0,1),"yyyy-MM-dd"),o=m(new Date(n.getFullYear(),11,31),"yyyy-MM-dd");try{const t=await p.get(`/agendamentos?data_inicio=${a}&data_fim=${o}`),s={cautelar:{pendente:0,confirmado:0,realizado:0,cancelado:0},transferencia:{pendente:0,confirmado:0,realizado:0,cancelado:0},outros:{pendente:0,confirmado:0,realizado:0,cancelado:0}};t.agendamentos.forEach(i=>{s[i.tipo_vistoria]&&(s[i.tipo_vistoria][i.status]=(s[i.tipo_vistoria][i.status]||0)+1)}),new Chart(e,{type:"bar",data:{labels:["Cautelar","Transferência","Outros"],datasets:[{label:"Pendentes",data:[s.cautelar.pendente,s.transferencia.pendente,s.outros.pendente],backgroundColor:"#fbbf24"},{label:"Confirmados",data:[s.cautelar.confirmado,s.transferencia.confirmado,s.outros.confirmado],backgroundColor:"#3b82f6"},{label:"Realizados",data:[s.cautelar.realizado,s.transferencia.realizado,s.outros.realizado],backgroundColor:"#22c55e"},{label:"Cancelados",data:[s.cautelar.cancelado,s.transferencia.cancelado,s.outros.cancelado],backgroundColor:"#ef4444"}]},options:{responsive:!0,maintainAspectRatio:!1,plugins:{legend:{position:"top"}},scales:{x:{stacked:!0},y:{stacked:!0,beginAtZero:!0}}}})}catch(t){console.error("Error creating status by type chart:",t)}}async createWeeklyStatusChart(){const e=document.getElementById("weeklyStatusChart");if(!e)return;const n=new Date,a=new Date(n.getTime()-7*24*60*60*1e3);try{const o=await p.get(`/agendamentos?data_inicio=${m(a,"yyyy-MM-dd")}&data_fim=${m(n,"yyyy-MM-dd")}`),t={};for(let i=0;i<7;i++){const r=m(new Date(n.getTime()-i*24*60*60*1e3),"yyyy-MM-dd");t[r]={pendente:0,confirmado:0,realizado:0,cancelado:0}}o.agendamentos.forEach(i=>{t[i.data]&&(t[i.data][i.status]=(t[i.data][i.status]||0)+1)});const s=Object.keys(t).sort();new Chart(e,{type:"bar",data:{labels:s.map(i=>m(new Date(i+"T00:00:00"),"dd/MM")),datasets:[{label:"Pendentes",data:s.map(i=>t[i].pendente),backgroundColor:"#fbbf24"},{label:"Confirmados",data:s.map(i=>t[i].confirmado),backgroundColor:"#3b82f6"},{label:"Realizados",data:s.map(i=>t[i].realizado),backgroundColor:"#22c55e"},{label:"Cancelados",data:s.map(i=>t[i].cancelado),backgroundColor:"#ef4444"}]},options:{responsive:!0,maintainAspectRatio:!1,plugins:{legend:{position:"top"}},scales:{y:{beginAtZero:!0}}}})}catch(o){console.error("Error creating weekly status chart:",o)}}async exportChart(e){const n=e==="revenue"?"revenueChart":"statusChart",a=document.getElementById(n);if(a)try{const{jsPDF:o}=window.jspdf,t=new o("l","mm","a4"),s=a.toDataURL("image/png");t.addImage(s,"PNG",15,15,270,150),t.save(`${e}-chart-${m(new Date,"yyyy-MM-dd")}.pdf`)}catch(o){console.error("Error exporting chart:",o),alert("Erro ao exportar gráfico. Tente novamente.")}}async exportChartDetail(e){const n=e==="revenue"?"revenueDetailContent":"statusDetailContent",a=document.getElementById(n);if(a)try{const o=await html2canvas(a,{scale:2,backgroundColor:"#f8fafc",logging:!1}),{jsPDF:t}=window.jspdf,s=new t("l","mm","a4"),i=o.toDataURL("image/png"),r=280,l=o.height*r/o.width;let c=l,u=10;for(s.addImage(i,"PNG",10,u,r,l),c-=190;c>=0;)u=c-l+10,s.addPage(),s.addImage(i,"PNG",10,u,r,l),c-=190;s.save(`${e}-detail-${m(new Date,"yyyy-MM-dd")}.pdf`)}catch(o){console.error("Error exporting chart detail:",o),alert("Erro ao exportar relatório. Tente novamente.")}}}window.adminPanel=new ee;
