document.addEventListener('DOMContentLoaded', function() {
    // 显示加载状态
    console.log('应用初始化中...');
    
    // 获取DOM元素
    const transactionLink = document.getElementById('transaction-link');
    const reportLink = document.getElementById('report-link');
    const transactionContent = document.getElementById('transaction-content');
    const reportContent = document.getElementById('report-content');
    const addRecordBtn = document.getElementById('add-record-btn');
    const recordFormOverlay = document.getElementById('record-form-overlay');
    const recordForm = document.getElementById('record-form');
    const closeRecordForm = document.getElementById('close-record-form');
    const formTitle = document.getElementById('form-title');
    const recordTypeExpense = document.getElementById('record-type-expense');
    const recordTypeIncome = document.getElementById('record-type-income');
    const expenseForm = document.getElementById('expense-form');
    const incomeForm = document.getElementById('income-form');
    const editIdField = document.getElementById('edit-id');
    const resetTransactionDateBtn = document.getElementById('reset-transaction-date');
    const resetReportDateBtn = document.getElementById('reset-report-date');
    const transactionsList = document.getElementById('transactions-list');
    const dailyBalanceElement = document.getElementById('daily-balance');
    const monthlyBalanceElement = document.getElementById('monthly-balance');
    const submitRecordBtn = document.getElementById('submit-record');

    // 初始化数据
    let transactions = JSON.parse(localStorage.getItem('transactions')) || [];
    let expenseChartInstance = null;
    let incomeChartInstance = null;

    // 初始化日期选择器
    const transactionDatePicker = flatpickr("#transaction-date-picker", {
        locale: "zh",
        dateFormat: "Y-m-d",
        defaultDate: new Date(),
        onChange: function(selectedDates) {
            const date = selectedDates[0];
            if (!date) return;
            
            const year = date.getFullYear();
            const month = date.getMonth() + 1;
            const day = date.getDate();
            
            updateDailyBalance(date);
            updateMonthlyBalance(year, month);
            renderTransactions(year, month, day);
        }
    });

    const reportDatePicker = flatpickr("#report-date-picker", {
        locale: "zh",
        dateFormat: "Y-m",
        defaultDate: new Date(),
        onChange: function(selectedDates, dateStr) {
            updateCharts(dateStr);
        }
    });

    // 菜单切换
    transactionLink.addEventListener('click', function(e) {
        e.preventDefault();
        setActiveLink(this);
        showTransactionContent();
    });

    reportLink.addEventListener('click', function(e) {
        e.preventDefault();
        setActiveLink(this);
        showReportContent();
    });

    function setActiveLink(activeLink) {
        document.querySelectorAll('.nav-links li a').forEach(link => {
            link.classList.remove('active');
        });
        activeLink.classList.add('active');
    }

    // 显示内容区
    function showTransactionContent() {
        transactionContent.style.display = 'block';
        reportContent.style.display = 'none';
        const date = transactionDatePicker.selectedDates[0] || new Date();
        const year = date.getFullYear();
        const month = date.getMonth() + 1;
        const day = date.getDate();
        
        updateDailyBalance(date);
        updateMonthlyBalance(year, month);
        renderTransactions(year, month, day);
    }

    function showReportContent() {
        transactionContent.style.display = 'none';
        reportContent.style.display = 'block';
        updateCharts(reportDatePicker.input.value);
    }

    // 记账表单功能
    addRecordBtn.addEventListener('click', function() {
        openRecordForm('add');
    });

    closeRecordForm.addEventListener('click', function() {
        closeRecordFormFunc();
    });

    recordFormOverlay.addEventListener('click', function(e) {
        if (e.target === recordFormOverlay) {
            closeRecordFormFunc();
        }
    });

    function openRecordForm(mode, transactionId = null) {
        // 设置当前日期时间
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        
        const currentDateTime = `${year}-${month}-${day}T${hours}:${minutes}`;
        
        if (mode === 'add') {
            formTitle.textContent = '记一笔';
            editIdField.value = '';
            
            // 重置表单
            document.getElementById('expense-amount').value = '';
            document.getElementById('expense-note').value = '';
            document.getElementById('expense-date').value = currentDateTime;
            document.getElementById('income-amount').value = '';
            document.getElementById('income-note').value = '';
            document.getElementById('income-date').value = currentDateTime;
            
            // 默认显示支出表单
            recordTypeExpense.checked = true;
            expenseForm.style.display = 'block';
            incomeForm.style.display = 'none';
        } else if (mode === 'edit' && transactionId) {
            formTitle.textContent = '编辑记录';
            const transaction = transactions.find(t => t.id === transactionId);
            
            if (transaction) {
                editIdField.value = transaction.id;
                const date = new Date(transaction.date);
                const formattedDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}T${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
                
                if (transaction.type === 'expense') {
                    recordTypeExpense.checked = true;
                    expenseForm.style.display = 'block';
                    incomeForm.style.display = 'none';
                    
                    document.getElementById('expense-amount').value = Math.abs(transaction.amount);
                    document.getElementById('expense-category').value = transaction.category;
                    document.getElementById('expense-note').value = transaction.note || '';
                    document.getElementById('expense-date').value = formattedDate;
                } else {
                    recordTypeIncome.checked = true;
                    expenseForm.style.display = 'none';
                    incomeForm.style.display = 'block';
                    
                    document.getElementById('income-amount').value = transaction.amount;
                    document.getElementById('income-category').value = transaction.category;
                    document.getElementById('income-note').value = transaction.note || '';
                    document.getElementById('income-date').value = formattedDate;
                }
            }
        }
        
        // 显示表单
        recordFormOverlay.style.display = 'block';
        setTimeout(() => {
            recordForm.style.right = '0';
        }, 10);
    }

    function closeRecordFormFunc() {
        recordForm.style.right = '-450px';
        setTimeout(() => {
            recordFormOverlay.style.display = 'none';
            // 重置表单
            document.getElementById('expense-amount').value = '';
            document.getElementById('expense-note').value = '';
            document.getElementById('income-amount').value = '';
            document.getElementById('income-note').value = '';
            editIdField.value = '';
        }, 300);
    }

    // 表单类型切换
    recordTypeExpense.addEventListener('change', function() {
        if (this.checked) {
            expenseForm.style.display = 'block';
            incomeForm.style.display = 'none';
        }
    });

    recordTypeIncome.addEventListener('change', function() {
        if (this.checked) {
            expenseForm.style.display = 'none';
            incomeForm.style.display = 'block';
        }
    });

    // 表单提交
    submitRecordBtn.addEventListener('click', function() {
        const isExpense = recordTypeExpense.checked;
        const amountInput = isExpense ? 'expense-amount' : 'income-amount';
        const amount = parseFloat(document.getElementById(amountInput).value);
        const category = document.getElementById(isExpense ? 'expense-category' : 'income-category').value;
        const note = document.getElementById(isExpense ? 'expense-note' : 'income-note').value;
        const date = document.getElementById(isExpense ? 'expense-date' : 'income-date').value;
        const editId = editIdField.value;
        
        if (!amount || amount <= 0) {
            alert('请输入有效的金额');
            return;
        }
        
        const transactionData = {
            id: editId ? parseInt(editId) : Date.now(),
            type: isExpense ? 'expense' : 'income',
            amount: isExpense ? -amount : amount,
            category,
            note,
            date: new Date(date).toISOString()
        };
        
        if (editId) {
            // 更新现有记录
            const index = transactions.findIndex(t => t.id === parseInt(editId));
            if (index !== -1) {
                transactions[index] = transactionData;
            }
        } else {
            // 添加新记录
            transactions.unshift(transactionData);
        }
        
        saveTransactions();
        
        const selectedDate = transactionDatePicker.selectedDates[0] || new Date();
        const year = selectedDate.getFullYear();
        const month = selectedDate.getMonth() + 1;
        const day = selectedDate.getDate();
        
        updateDailyBalance(selectedDate);
        updateMonthlyBalance(year, month);
        renderTransactions(year, month, day);
        
        if (reportContent.style.display !== 'none') {
            updateCharts(reportDatePicker.input.value);
        }
        
        closeRecordFormFunc();
    });

    // 保存交易记录
    function saveTransactions() {
        localStorage.setItem('transactions', JSON.stringify(transactions));
    }

    // 渲染交易记录
    function renderTransactions(year, month, day) {
        year = parseInt(year);
        month = parseInt(month);
        day = parseInt(day);
        
        const filteredTransactions = transactions.filter(t => {
            const date = new Date(t.date);
            return date.getFullYear() === year && 
                   (date.getMonth() + 1) === month &&
                   date.getDate() === day;
        });
        
        if (filteredTransactions.length === 0) {
            transactionsList.innerHTML = '<tr><td colspan="6" class="text-center text-muted py-5">暂无交易记录</td></tr>';
            return;
        }
        
        transactionsList.innerHTML = filteredTransactions.map(transaction => {
            const date = new Date(transaction.date);
            const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
            const timeStr = `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
            const amountClass = transaction.type === 'income' ? 'income-amount' : 'expense-amount';
            const amountSign = transaction.type === 'income' ? '+' : '-';
            
            return `
                <tr>
                    <td class="px-5">
                        <div>${dateStr}</div>
                        <small class="text-muted">${timeStr}</small>
                    </td>
                    <td class="px-5">
                        <span class="badge ${transaction.type === 'income' ? 'bg-success' : 'bg-danger'}">
                            ${transaction.type === 'income' ? '收入' : '支出'}
                        </span>
                    </td>
                    <td class="px-5">${transaction.category}</td>
                    <td class="px-5 text-end ${amountClass}">
                        ${amountSign}¥${Math.abs(transaction.amount).toFixed(2)}
                    </td>
                    <td class="px-5">${transaction.note || '-'}</td>
                    <td class="px-5">
                        <div class="action-buttons">
                            <button class="btn btn-sm btn-outline-primary edit-btn" data-id="${transaction.id}">
                                <i class="bi bi-pencil"></i>
                            </button>
                            <button class="btn btn-sm btn-outline-danger delete-btn" data-id="${transaction.id}">
                                <i class="bi bi-trash"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
        
        // 绑定编辑和删除按钮事件
        document.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const id = parseInt(this.getAttribute('data-id'));
                openRecordForm('edit', id);
            });
        });
        
        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const id = parseInt(this.getAttribute('data-id'));
                deleteTransaction(id);
            });
        });
    }

    // 删除交易记录
    function deleteTransaction(id) {
        if (confirm('确定要删除这条记录吗？')) {
            transactions = transactions.filter(t => t.id !== id);
            saveTransactions();
            const selectedDate = transactionDatePicker.selectedDates[0] || new Date();
            const year = selectedDate.getFullYear();
            const month = selectedDate.getMonth() + 1;
            const day = selectedDate.getDate();
            
            updateDailyBalance(selectedDate);
            updateMonthlyBalance(year, month);
            renderTransactions(year, month, day);
            
            if (reportContent.style.display !== 'none') {
                updateCharts(reportDatePicker.input.value);
            }
        }
    }

    // 更新日盈亏
    function updateDailyBalance(date) {
        if (!(date instanceof Date)) {
            date = new Date(date);
        }
        
        const dateStr = date.toISOString().split('T')[0];
        const dailyTransactions = transactions.filter(t => {
            const tDate = new Date(t.date);
            const tDateStr = tDate.toISOString().split('T')[0];
            return tDateStr === dateStr;
        });
        
        const dailyBalance = dailyTransactions.reduce((sum, t) => sum + t.amount, 0);
        dailyBalanceElement.textContent = `¥${dailyBalance.toFixed(2)}`;
        dailyBalanceElement.style.color = dailyBalance >= 0 ? 'var(--income-color)' : 'var(--expense-color)';
    }

    // 更新月盈亏
    function updateMonthlyBalance(year, month) {
        year = parseInt(year);
        month = parseInt(month);
        
        const monthlyTransactions = transactions.filter(t => {
            const date = new Date(t.date);
            return date.getFullYear() === year && 
                   (date.getMonth() + 1) === month;
        });
        
        const monthlyBalance = monthlyTransactions.reduce((sum, t) => sum + t.amount, 0);
        monthlyBalanceElement.textContent = `¥${monthlyBalance.toFixed(2)}`;
        monthlyBalanceElement.style.color = monthlyBalance >= 0 ? 'var(--income-color)' : 'var(--expense-color)';
    }

    // 更新图表
    function updateCharts(monthStr) {
        if (!monthStr) return;
        
        const [year, month] = monthStr.split('-');
        const monthlyTransactions = transactions.filter(t => {
            const date = new Date(t.date);
            return date.getFullYear() === parseInt(year) && 
                   (date.getMonth() + 1) === parseInt(month);
        });
        
        // 处理支出和收入数据
        const expenseData = {};
        const incomeData = {};
        
        monthlyTransactions.forEach(t => {
            if (t.type === 'expense') {
                expenseData[t.category] = (expenseData[t.category] || 0) + Math.abs(t.amount);
            } else {
                incomeData[t.category] = (incomeData[t.category] || 0) + t.amount;
            }
        });
        
        updateChart('expenseChart', expenseData, '支出分类');
        updateChart('incomeChart', incomeData, '收入分类');
    }

    // 更新单个图表
    function updateChart(chartId, data, title) {
        const ctx = document.getElementById(chartId).getContext('2d');
        const labels = Object.keys(data);
        const values = Object.values(data);
        
        if (labels.length === 0) {
            labels.push('无数据');
            values.push(0);
        }
        
        const backgroundColors = labels.map((_, i) => {
            const hue = (i * 137.508) % 360;
            return `hsl(${hue}, 70%, 60%)`;
        });
        
        // 销毁旧图表
        if (chartId === 'expenseChart' && expenseChartInstance) {
            expenseChartInstance.destroy();
        } else if (chartId === 'incomeChart' && incomeChartInstance) {
            incomeChartInstance.destroy();
        }
        
        const newChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: values,
                    backgroundColor: backgroundColors,
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: title,
                        font: {
                            size: 16
                        }
                    },
                    legend: {
                        position: 'right',
                        labels: {
                            boxWidth: 12,
                            padding: 20
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = context.raw || 0;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = Math.round((value / total) * 100);
                                return `${label}: ¥${value.toFixed(2)} (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
        
        // 保存图表实例
        if (chartId === 'expenseChart') {
            expenseChartInstance = newChart;
        } else {
            incomeChartInstance = newChart;
        }
    }

    // 重置日期
    resetTransactionDateBtn.addEventListener('click', function(e) {
        e.preventDefault();
        transactionDatePicker.setDate(new Date(), true);
    });

    resetReportDateBtn.addEventListener('click', function(e) {
        e.preventDefault();
        reportDatePicker.setDate(new Date(), true);
    });

    // 初始化
    setActiveLink(transactionLink);
    
    // 初始化加载今天的数据
    const today = new Date();
    updateDailyBalance(today);
    updateMonthlyBalance(today.getFullYear(), today.getMonth() + 1);
    renderTransactions(today.getFullYear(), today.getMonth() + 1, today.getDate());
    
    // 确保加载动画会被隐藏
    setTimeout(function() {
        document.getElementById('loading').style.display = 'none';
    }, 500);
    
    console.log('应用初始化完成');
});

// 全局错误处理
window.addEventListener('error', function(e) {
    console.error('全局错误:', e.message);
    document.getElementById('loading').style.display = 'none';
});