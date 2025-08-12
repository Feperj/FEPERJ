// Dashboard e Relatórios

let dashboardData = null;
let chartInstances = {};

// Carregar dashboard
async function loadDashboard() {
    try {
        const response = await apiRequest('/relatorios/dashboard');
        dashboardData = response;
        
        updateDashboardCards();
        createCharts();
        loadAtividadesRecentes();
        
    } catch (error) {
        console.error('Erro ao carregar dashboard:', error);
        showAlert('Erro ao carregar dashboard: ' + error.message, 'error');
    }
}

// Atualizar cards do dashboard
function updateDashboardCards() {
    if (!dashboardData) return;
    
    const { totais } = dashboardData;
    
    document.getElementById('totalAtletas').textContent = totais.atletas || 0;
    document.getElementById('totalEquipes').textContent = totais.equipes || 0;
    document.getElementById('totalCompeticoes').textContent = totais.competicoes || 0;
    document.getElementById('totalInscricoes').textContent = totais.inscricoes || 0;
}

// Criar gráficos
function createCharts() {
    if (!dashboardData) return;
    
    createAtletasPorEquipeChart();
    createInscricoesChart();
    createCompeticoesChart();
}

// Gráfico de atletas por equipe
function createAtletasPorEquipeChart() {
    const ctx = document.getElementById('atletasPorEquipeChart');
    if (!ctx || !dashboardData.atletas_por_equipe) return;
    
    // Destruir gráfico anterior se existir
    if (chartInstances.atletasPorEquipe) {
        chartInstances.atletasPorEquipe.destroy();
    }
    
    const data = dashboardData.atletas_por_equipe;
    const labels = data.map(item => item.equipe_nome || 'Sem Equipe');
    const values = data.map(item => item.count);
    
    chartInstances.atletasPorEquipe = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Número de Atletas',
                data: values,
                backgroundColor: [
                    'rgba(59, 130, 246, 0.8)',
                    'rgba(16, 185, 129, 0.8)',
                    'rgba(245, 158, 11, 0.8)',
                    'rgba(239, 68, 68, 0.8)',
                    'rgba(139, 92, 246, 0.8)',
                    'rgba(236, 72, 153, 0.8)',
                    'rgba(14, 165, 233, 0.8)',
                    'rgba(34, 197, 94, 0.8)'
                ],
                borderColor: [
                    'rgba(59, 130, 246, 1)',
                    'rgba(16, 185, 129, 1)',
                    'rgba(245, 158, 11, 1)',
                    'rgba(239, 68, 68, 1)',
                    'rgba(139, 92, 246, 1)',
                    'rgba(236, 72, 153, 1)',
                    'rgba(14, 165, 233, 1)',
                    'rgba(34, 197, 94, 1)'
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `Atletas: ${context.parsed.y}`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1
                    }
                }
            }
        }
    });
}

// Gráfico de inscrições (será implementado quando houver dados)
function createInscricoesChart() {
    // Implementar quando houver dados de inscrições por período
}

// Gráfico de competições (será implementado quando houver dados)
function createCompeticoesChart() {
    // Implementar quando houver dados de competições por status
}

// Carregar atividades recentes
async function loadAtividadesRecentes() {
    const container = document.getElementById('atividadesRecentes');
    if (!container) return;
    
    try {
        // Simular atividades recentes (será implementado com dados reais)
        const atividades = [
            {
                tipo: 'atleta',
                acao: 'Novo atleta cadastrado',
                detalhes: 'João Silva foi cadastrado no sistema',
                data: new Date(Date.now() - 2 * 60 * 60 * 1000) // 2 horas atrás
            },
            {
                tipo: 'inscricao',
                acao: 'Nova inscrição realizada',
                detalhes: 'Maria Santos se inscreveu na Competição Regional',
                data: new Date(Date.now() - 4 * 60 * 60 * 1000) // 4 horas atrás
            },
            {
                tipo: 'equipe',
                acao: 'Nova equipe criada',
                detalhes: 'Equipe Power Rio foi criada',
                data: new Date(Date.now() - 6 * 60 * 60 * 1000) // 6 horas atrás
            },
            {
                tipo: 'competicao',
                acao: 'Nova competição criada',
                detalhes: 'Campeonato Estadual 2025 foi criado',
                data: new Date(Date.now() - 24 * 60 * 60 * 1000) // 1 dia atrás
            }
        ];
        
        container.innerHTML = atividades.map(atividade => `
            <div class="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                <div class="flex-shrink-0">
                    <div class="w-8 h-8 rounded-full flex items-center justify-center ${getAtividadeIconClass(atividade.tipo)}">
                        <i class="fas ${getAtividadeIcon(atividade.tipo)} text-white text-sm"></i>
                    </div>
                </div>
                <div class="flex-1 min-w-0">
                    <p class="text-sm font-medium text-gray-900">${atividade.acao}</p>
                    <p class="text-sm text-gray-500">${atividade.detalhes}</p>
                    <p class="text-xs text-gray-400">${formatDateTime(atividade.data)}</p>
                </div>
            </div>
        `).join('');
        
    } catch (error) {
        console.error('Erro ao carregar atividades recentes:', error);
        container.innerHTML = '<p class="text-gray-500 text-center">Erro ao carregar atividades</p>';
    }
}

// Obter ícone da atividade
function getAtividadeIcon(tipo) {
    const icons = {
        atleta: 'fa-user',
        inscricao: 'fa-clipboard-list',
        equipe: 'fa-shield-alt',
        competicao: 'fa-trophy',
        default: 'fa-info-circle'
    };
    return icons[tipo] || icons.default;
}

// Obter classe do ícone da atividade
function getAtividadeIconClass(tipo) {
    const classes = {
        atleta: 'bg-blue-500',
        inscricao: 'bg-green-500',
        equipe: 'bg-purple-500',
        competicao: 'bg-yellow-500',
        default: 'bg-gray-500'
    };
    return classes[tipo] || classes.default;
}

// Atualizar dashboard periodicamente
function startDashboardAutoRefresh() {
    setInterval(() => {
        if (document.getElementById('dashboard').classList.contains('active')) {
            loadDashboard();
        }
    }, 5 * 60 * 1000); // Atualizar a cada 5 minutos
}

// Função para obter estatísticas gerais
function getDashboardStats() {
    if (!dashboardData) return null;
    
    return {
        totais: dashboardData.totais,
        atletasPorEquipe: dashboardData.atletas_por_equipe,
        // Adicionar mais estatísticas conforme necessário
    };
}

// Função para exportar relatório do dashboard
async function exportDashboardReport() {
    try {
        const stats = getDashboardStats();
        if (!stats) {
            showAlert('Nenhum dado disponível para exportar', 'warning');
            return;
        }
        
        const reportData = [
            {
                'Relatório': 'Dashboard FEPERJ',
                'Data': formatDateTime(new Date()),
                'Total de Atletas': stats.totais.atletas,
                'Total de Equipes': stats.totais.equipes,
                'Total de Competições': stats.totais.competicoes,
                'Total de Inscrições': stats.totais.inscricoes
            }
        ];
        
        // Adicionar dados de atletas por equipe
        if (stats.atletasPorEquipe) {
            stats.atletasPorEquipe.forEach(item => {
                reportData.push({
                    'Relatório': 'Atletas por Equipe',
                    'Equipe': item.equipe_nome || 'Sem Equipe',
                    'Total de Atletas': item.count
                });
            });
        }
        
        downloadCSV(reportData, `dashboard_feperj_${new Date().toISOString().split('T')[0]}.csv`);
        showAlert('Relatório do dashboard exportado com sucesso!', 'success');
        
    } catch (error) {
        console.error('Erro ao exportar relatório do dashboard:', error);
        showAlert('Erro ao exportar relatório: ' + error.message, 'error');
    }
}

// Função para mostrar métricas detalhadas
function showMetricDetails(metricType) {
    let title = '';
    let data = [];
    
    switch (metricType) {
        case 'atletas':
            title = 'Detalhes dos Atletas';
            data = atletas || [];
            break;
        case 'equipes':
            title = 'Detalhes das Equipes';
            data = equipes || [];
            break;
        case 'competicoes':
            title = 'Detalhes das Competições';
            data = competicoes || [];
            break;
        case 'inscricoes':
            title = 'Detalhes das Inscrições';
            data = inscricoes || [];
            break;
        default:
            return;
    }
    
    // Criar modal com detalhes
    const modalHtml = `
        <div class="modal" id="metricDetailsModal">
            <div class="modal-content" style="max-width: 80%;">
                <div class="modal-header">
                    <h3 class="text-lg font-medium text-gray-900">${title}</h3>
                    <button class="modal-close">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="overflow-x-auto">
                        <table class="min-w-full divide-y divide-gray-200">
                            <thead class="bg-gray-50">
                                <tr>
                                    ${Object.keys(data[0] || {}).map(key => 
                                        `<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">${key}</th>`
                                    ).join('')}
                                </tr>
                            </thead>
                            <tbody class="bg-white divide-y divide-gray-200">
                                ${data.map(item => `
                                    <tr>
                                        ${Object.values(item).map(value => 
                                            `<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${value || '-'}</td>`
                                        ).join('')}
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn-secondary modal-close">Fechar</button>
                </div>
            </div>
        </div>
    `;
    
    // Remover modal anterior se existir
    const existingModal = document.getElementById('metricDetailsModal');
    if (existingModal) {
        existingModal.remove();
    }
    
    // Adicionar modal ao DOM
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    
    // Configurar event listeners
    const modal = document.getElementById('metricDetailsModal');
    modal.querySelectorAll('.modal-close').forEach(btn => {
        btn.addEventListener('click', () => {
            modal.remove();
        });
    });
    
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });
    
    showModal('metricDetailsModal');
}

// Event listeners
document.addEventListener('DOMContentLoaded', function() {
    // Iniciar auto-refresh do dashboard
    startDashboardAutoRefresh();
    
    // Adicionar event listeners para cards clicáveis
    const dashboardCards = document.querySelectorAll('#dashboard .bg-white');
    dashboardCards.forEach((card, index) => {
        card.style.cursor = 'pointer';
        card.addEventListener('click', () => {
            const metricTypes = ['atletas', 'equipes', 'competicoes', 'inscricoes'];
            if (metricTypes[index]) {
                showMetricDetails(metricTypes[index]);
            }
        });
        
        // Adicionar hover effect
        card.addEventListener('mouseenter', () => {
            card.classList.add('shadow-lg');
        });
        
        card.addEventListener('mouseleave', () => {
            card.classList.remove('shadow-lg');
        });
    });
});

// Função para limpar gráficos quando sair do dashboard
function cleanupDashboard() {
    Object.values(chartInstances).forEach(chart => {
        if (chart && typeof chart.destroy === 'function') {
            chart.destroy();
        }
    });
    chartInstances = {};
}

// Função para recriar gráficos quando voltar ao dashboard
function recreateDashboard() {
    if (document.getElementById('dashboard').classList.contains('active')) {
        loadDashboard();
    }
}
