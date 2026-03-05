<template>
  <div class="paper-management">
    <!-- 手动组卷全页面模式 -->
    <div v-if="showManualPaperPage" class="manual-paper-page">
      <!-- 页面头部 -->
      <div class="header-left">
        <button class="btn btn-secondary" @click="goBackToList">
          返回列表
        </button>
      </div>

      <!-- 试卷基本信息 -->
      <div class="paper-basic-info">
        <h4>试卷基本信息</h4>
        <div class="info-form">
          <div class="form-row">
            <label for="manual-position-select">职业(工种)</label>
            <div class="form-control">
              <select id="manual-position-select" class="form-select" v-model="currentPaper.jobType">
                <option value="" disabled selected>请选择职业(工种)</option>
                <option v-for="position in positionOptions" :key="position.id" :value="position.name">
                  {{ position.name }}
                </option>
              </select>
            </div>
          </div>

          <div class="form-row">
            <label for="manual-exam-level">技能等级</label>
            <div class="form-control">
              <select id="manual-exam-level" class="form-select" v-model="currentPaper.level">
                <option value="" disabled selected>请选择技能等级</option>
                <option v-for="level in levelOptions" :key="level.id" :value="level.name">
                  {{ level.name }}
                </option>
              </select>
            </div>
          </div>

          <div class="form-row">
            <label for="manual-paper-desc">试卷描述</label>
            <div class="form-control">
              <textarea id="manual-paper-desc" class="form-textarea" v-model="currentPaper.desc"
                placeholder="请输入试卷描述"></textarea>
            </div>
          </div>
        </div>
      </div>

      <!-- 题库选择 -->
      <div class="question-bank-selection">
        <h4>选择题库</h4>
        <div class="bank-selection-form">
          <div class="form-row">
            <label for="question-bank-select">选择题库</label>
            <div class="form-control">
              <select id="question-bank-select" class="form-select" v-model="selectedQuestionBank">
                <option value="" disabled selected>请选择题库</option>
                <option v-for="bank in questionBankList" :key="bank.id" :value="bank.id">
                  {{ bank.name }}
                </option>
              </select>
            </div>
          </div>
          <div class="form-row">
            <button class="btn btn-primary" @click="loadQuestionsFromBank" :disabled="!selectedQuestionBank">
              加载题库题目
            </button>
          </div>
        </div>
      </div>

      <!-- 题目选择区域 -->
      <div class="question-selection-area">
        <div class="selection-header">
          <h3>选择题库题目</h3>
          <div class="selection-actions">
            <button class="btn btn-select-all" @click="selectAllQuestions">全选</button>
            <button class="btn btn-clear" @click="clearSelection">清空</button>
          </div>
        </div>

        <!-- 题型筛选 -->
        <div class="question-type-filter">
          <h4>题型筛选</h4>
          <div class="filter-buttons">
            <button v-for="type in questionTypeList" :key="type.value" class="filter-btn"
              :class="{ active: selectedQuestionType === type.value }" @click="selectQuestionType(type.value)">
              {{ type.label }}
            </button>
          </div>
        </div>

        <!-- 题目列表 -->
        <div class="questions-container">
          <div class="questions-header">
            <h4>{{ getQuestionTypeLabel(selectedQuestionType) }}题目列表</h4>
            <span class="question-count">共 {{ filteredQuestions.length }} 题</span>
          </div>

          <div class="questions-list">
            <div v-for="question in filteredQuestions" :key="question.id" class="question-item"
              :class="{ selected: isQuestionSelected(question) }">
              <div class="question-info">
                <div class="question-header">
                  <input type="checkbox" :checked="isQuestionSelected(question)"
                    @change="toggleQuestionSelection(question)" class="question-checkbox" />
                  <span class="question-id">ID: {{ question.id }}</span>
                  <span class="question-type">{{ question.questionType }}</span>
                </div>
                <div class="question-content">
                  <span>{{ question.questionContent }}</span>
                </div>
                <div class="question-answer">
                  <span class="answer-label">答案:</span>
                  <span class="answer-content">{{ formatAnswer(question.answer, question.questionType) }}</span>
                </div>
              </div>
              <div class="question-score">
                <label>分数:</label>
                <input type="number" v-model="questionScores[question.id]" class="score-input"
                  :placeholder="getDefaultScore(question.questionType)" min="1" max="20" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 操作按钮 -->
      <div class="page-actions">
        <button class="btn btn-secondary" @click="goBackToList">取消</button>
        <button class="btn btn-primary" @click="saveManualPaper" :disabled="isSaving">
          {{ isSaving ? '保存中...' : '保存试卷' }}
        </button>
      </div>
    </div>

    <!-- 原有的组卷管理页面 -->
    <div v-else>
      <h2 class="page-title">组卷管理</h2>

      <template v-if="!showPaperDetail">
        <!-- 操作按钮 -->
        <div class="action-buttons">
          <button class="btn btn-manual" @click="showManualAddModal">
            <span class="plus-icon">+</span> 手动组卷
          </button>
          <button class="btn btn-dispatch" @click="showMultiDispatchModal" :disabled="selectedPapers.length === 0">
            批量派发
            <span v-if="selectedPapers.length > 0">({{ selectedPapers.length }})</span>
          </button>
        </div>

        <!-- 加载状态 -->
        <div v-if="isLoading" class="loading-container">
          <div class="loading-spinner"></div>
          <p>加载中...</p>
        </div>

        <!-- 错误信息 -->
        <div v-else-if="error" class="error-message">
          {{ error }}
          <button class="btn btn-primary retry-btn" @click="fetchPapers">重试</button>
        </div>

        <!-- 数据表格 -->
        <div v-else class="table-responsive">
          <table class="data-table">
            <thead>
              <tr>
                <th width="40">
                  <input type="checkbox" :checked="isAllSelected" @change="toggleSelectAll" class="checkbox" />
                </th>
                <th>序号</th>
                <th>考试ID</th>
                <th>职业(工种)</th>
                <th>技能等级</th>
                <th>考核站</th>
                <th>创建时间</th>
                <th>派发状态</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(paper, index) in paginatedPapers" :key="index">
                <td>
                  <input type="checkbox" :checked="isPaperSelected(paper)" @change="togglePaperSelection(paper)"
                    class="checkbox" />
                </td>
                <td>{{ (currentPage - 1) * pageSize + index + 1 }}</td>
                <td>{{ paper.id }}</td>
                <td>{{ paper.jobType }}</td>
                <td>{{ paper.level }}</td>
                <td>{{ getStationName(paper.stationId) }}</td>
                <td>{{ formatDateTime(paper.createTime) }}</td>
                <td>
                  <span :class="paper.status === 1 ? 'status-dispatched' : 'status-not-dispatched'">{{ paper.status ===
                    1
                    ? '已派发' : '未派发' }}</span>
                </td>
                <td class="operations">
                  <a href="#" class="view-link" @click.prevent="viewPaper(paper)">查看</a>
                  <a href="#" class="download-link" @click.prevent="showDownloadModal(paper)">下载</a>
                  <a href="#" class="edit-link" @click.prevent="editPaper(paper)">编辑</a>
                  <a href="#" class="dispatch-link" @click.prevent="showDispatchModal(paper)">派发</a>
                  <a href="#" class="delete-link" @click.prevent="deletePaper(paper)">删除</a>
                </td>
              </tr>
              <tr v-if="paginatedPapers.length === 0">
                <td colspan="8" class="no-data">暂无数据</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- 分页控件 -->
        <div class="pagination-container" v-if="!isLoading && !error && totalItems > 0">
          <div class="total-count">共 {{ totalItems }} 条</div>
          <div class="pagination">
            <a href="#" class="page-nav prev" @click.prevent="goToPage(currentPage - 1)"
              :class="{ disabled: currentPage === 1 }">&lt;</a>
            <template v-for="page in displayedPages" :key="page">
              <template v-if="page === '...'">
                <span class="ellipsis">...</span>
              </template>
              <template v-else>
                <a href="#" class="page-number" :class="{ active: page === currentPage }"
                  @click.prevent="goToPage(page)">{{ page }}</a>
              </template>
            </template>
            <a href="#" class="page-nav next" @click.prevent="goToPage(currentPage + 1)"
              :class="{ disabled: currentPage === totalPages }">&gt;</a>
          </div>
          <div class="page-size-selector">
            <span>{{ pageSize }} 条/页</span>
            <select v-model="pageSize" @change="handlePageSizeChange">
              <option :value="5">5</option>
              <option :value="10">10</option>
              <option :value="20">20</option>
            </select>
          </div>
        </div>
      </template>
      <template v-else>
        <!-- 二级详情页 -->
        <div class="content-container">
          <div class="back-button-container top-back-button">
            <button class="btn btn-secondary" @click="goBackToPaperList">返回</button>
          </div>
          <div class="exam-info-header">
            <div class="info-section">
              <div class="info-item">
                <span class="info-label">组卷名称:</span>
                <span class="info-value">{{ currentPaperDetail.level }} - {{ currentPaperDetail.jobType }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">创建时间:</span>
                <span class="info-value">{{ currentPaperDetail.createTime }}</span>
              </div>
            </div>

            <!-- 题型统计信息 -->
            <div class="question-type-summary">
              <h4>题型统计</h4>
              <div class="summary-grid">
                <div class="summary-item" v-for="(summary, index) in questionTypeSummary" :key="index">
                  <div class="summary-type">{{ summary.type }}</div>
                  <div class="summary-count">{{ summary.count }}题</div>
                  <div class="summary-score">{{ summary.totalScore }}分</div>
                </div>
              </div>
              <div class="summary-total">
                <span class="total-label">总计:</span>
                <span class="total-count">{{ totalQuestionCount }}题</span>
                <span class="total-score">{{ totalScore }}分</span>
              </div>
            </div>
          </div>
          <div v-if="isLoadingQuestions" class="loading-container">
            <div class="loading-spinner"></div>
            <p>加载中...</p>
          </div>
          <div v-else-if="questionsError" class="error-message">
            {{ questionsError }}
            <button class="btn btn-primary retry-btn" @click="viewPaper(currentPaperDetail)">重试</button>
          </div>
          <div v-else class="questions-container">
            <!-- 填空题 -->
            <div class="question-section">
              <h3 class="section-title">填空题</h3>
              <template v-if="groupedQuestions.fillBlank.length > 0">
                <div v-for="(q, idx) in groupedQuestions.fillBlank" :key="q.id" class="question-item">
                  <div class="question-header-inline">
                    <span class="question-number">{{ idx + 1 }}.</span>
                    <span class="question-text">
                      <span v-html="q._questionContentHtml || q.questionContent"></span>
                    </span>
                  </div>
                  <div class="question-divider"></div>
                </div>
              </template>
              <template v-else>
                <div class="no-data">暂无此类题目</div>
              </template>
            </div>

            <!-- 单选题 -->
            <div class="question-section">
              <h3 class="section-title">单项选择题</h3>
              <template v-if="groupedQuestions.singleChoice.length > 0">
                <div v-for="(q, idx) in groupedQuestions.singleChoice" :key="q.id" class="question-item">
                  <div class="question-header-inline">
                    <span class="question-number">{{ idx + 1 }}.</span>
                    <span class="question-text">
                      <span v-html="questionContentHtmlList[idx]"></span>
                    </span>
                  </div>
                  <div class="question-options">
                    <div v-if="q.answera" class="option">
                      <span class="option-letter">A.</span>
                      <span v-html="q._answeraHtml || q.answera"></span>
                    </div>
                    <div v-if="q.answerb" class="option">
                      <span class="option-letter">B.</span>
                      <span v-html="q._answerbHtml || q.answerb"></span>
                    </div>
                    <div v-if="q.answerc" class="option">
                      <span class="option-letter">C.</span>
                      <span v-html="q._answercHtml || q.answerc"></span>
                    </div>
                    <div v-if="q.answerd" class="option">
                      <span class="option-letter">D.</span>
                      <span v-html="q._answerdHtml || q.answerd"></span>
                    </div>
                    <div v-if="q.answere" class="option">
                      <span class="option-letter">E.</span>
                      <span v-html="q._answereHtml || q.answere"></span>
                    </div>
                    <div v-if="q.answerf" class="option">
                      <span class="option-letter">F.</span>
                      <span v-html="q._answerfHtml || q.answerf"></span>
                    </div>
                    <div v-if="q.answerg" class="option">
                      <span class="option-letter">G.</span>
                      <span v-html="q._answergHtml || q.answerg"></span>
                    </div>
                    <div v-if="q.answerh" class="option">
                      <span class="option-letter">H.</span>
                      <span v-html="q._answerhHtml || q.answerh"></span>
                    </div>
                    <div v-if="q.answeri" class="option">
                      <span class="option-letter">I.</span>
                      <span v-html="q._answeriHtml || q.answeri"></span>
                    </div>
                    <div v-if="q.answerj" class="option">
                      <span class="option-letter">J.</span>
                      <span v-html="q._answerjHtml || q.answerj"></span>
                    </div>
                  </div>

                  <div class="question-divider"></div>
                </div>
              </template>
              <template v-else>
                <div class="no-data">暂无此类题目</div>
              </template>
            </div>

            <!-- 多选题 -->
            <div class="question-section">
              <h3 class="section-title">多项选择题</h3>
              <template v-if="groupedQuestions.multiChoice.length > 0">
                <div v-for="(q, idx) in groupedQuestions.multiChoice" :key="q.id" class="question-item">
                  <div class="question-header-inline">
                    <span class="question-number">{{ idx + 1 }}.</span>
                    <span class="question-text">
                      <span v-html="q._questionContentHtml || q.questionContent"></span>
                    </span>
                  </div>
                  <div class="question-options">
                    <div v-if="q.answera" class="option">
                      <span class="option-letter">A.</span>
                      <span v-html="q._answeraHtml || q.answera"></span>
                    </div>
                    <div v-if="q.answerb" class="option">
                      <span class="option-letter">B.</span>
                      <span v-html="q._answerbHtml || q.answerb"></span>
                    </div>
                    <div v-if="q.answerc" class="option">
                      <span class="option-letter">C.</span>
                      <span v-html="q._answercHtml || q.answerc"></span>
                    </div>
                    <div v-if="q.answerd" class="option">
                      <span class="option-letter">D.</span>
                      <span v-html="q._answerdHtml || q.answerd"></span>
                    </div>
                    <div v-if="q.answere" class="option">
                      <span class="option-letter">E.</span>
                      <span v-html="q._answereHtml || q.answere"></span>
                    </div>
                    <div v-if="q.answerf" class="option">
                      <span class="option-letter">F.</span>
                      <span v-html="q._answerfHtml || q.answerf"></span>
                    </div>
                    <div v-if="q.answerg" class="option">
                      <span class="option-letter">G.</span>
                      <span v-html="q._answergHtml || q.answerg"></span>
                    </div>
                    <div v-if="q.answerh" class="option">
                      <span class="option-letter">H.</span>
                      <span v-html="q._answerhHtml || q.answerh"></span>
                    </div>
                    <div v-if="q.answeri" class="option">
                      <span class="option-letter">I.</span>
                      <span v-html="q._answeriHtml || q.answeri"></span>
                    </div>
                    <div v-if="q.answerj" class="option">
                      <span class="option-letter">J.</span>
                      <span v-html="q._answerjHtml || q.answerj"></span>
                    </div>
                  </div>
                  <div class="question-divider"></div>
                </div>
              </template>
              <template v-else>
                <div class="no-data">暂无此类题目</div>
              </template>
            </div>

            <!-- 判断题 -->
            <div class="question-section">
              <h3 class="section-title">判断题</h3>
              <template v-if="groupedQuestions.decide.length > 0">
                <div v-for="(q, idx) in groupedQuestions.decide" :key="q.id" class="question-item">
                  <div class="question-header-inline">
                    <span class="question-number">{{ idx + 1 }}.</span>
                    <span class="question-text">
                      <span v-html="q._questionContentHtml || q.questionContent"></span>
                    </span>
                  </div>
                  <div class="question-options">
                    <div class="option">
                      <span class="option-letter">A.</span> 正确
                    </div>
                    <div class="option">
                      <span class="option-letter">B.</span> 错误
                    </div>
                  </div>
                  <div class="question-divider"></div>
                </div>
              </template>
              <template v-else>
                <div class="no-data">暂无此类题目</div>
              </template>
            </div>

            <!-- 简答题 -->
            <div class="question-section">
              <h3 class="section-title">简答题</h3>
              <template v-if="groupedQuestions.shortAnswer.length > 0">
                <div v-for="(q, idx) in groupedQuestions.shortAnswer" :key="q.id" class="question-item">
                  <div class="question-header-inline">
                    <span class="question-number">{{ idx + 1 }}.</span>
                    <span class="question-text">
                      <span v-html="q._questionContentHtml || q.questionContent"></span>
                    </span>
                  </div>

                  <div class="question-divider"></div>
                </div>
              </template>
              <template v-else>
                <div class="no-data">暂无此类题目</div>
              </template>
            </div>

            <!-- 综合题 -->
            <div class="question-section">
              <h3 class="section-title">综合题</h3>
              <template v-if="groupedQuestions.comprehensive.length > 0">
                <div v-for="(q, idx) in groupedQuestions.comprehensive" :key="q.id" class="question-item">
                  <div class="question-header-inline">
                    <span class="question-number">{{ idx + 1 }}.</span>
                    <span class="question-text">
                      <span v-html="q._questionContentHtml || q.questionContent"></span>
                    </span>
                  </div>

                  <div class="question-divider"></div>
                </div>
              </template>
              <template v-else>
                <div class="no-data">暂无此类题目</div>
              </template>
            </div>
          </div>
        </div>
      </template>

      <!-- 组卷模态框 -->
      <div class="modal-overlay" v-if="isModalVisible" @click="closeModal">
        <div class="modal-container" @click.stop>
          <div class="modal-header">
            <h3>{{ isEditMode ? "编辑" : "手动组卷" }}</h3>
            <button class="close-btn" @click="closeModal">&times;</button>
          </div>
          <div class="modal-body">
            <!-- 新增的职位选择 -->
            <div class="form-row">
              <label for="position-select">职业(工种)</label>
              <div class="form-control">
                <select id="position-select" class="form-select" v-model="currentPaper.jobType">
                  <option value disabled selected>请选择职业(工种)</option>
                  <!-- 这里将根据您的'职位'数据来源动态填充选项 -->
                  <option v-for="position in positionOptions" :key="position.id" :value="position.name">{{ position.name
                  }}
                  </option>
                </select>
              </div>
            </div>

            <!-- 报考等级 -->
            <div class="form-row">
              <label for="exam-level">技能等级</label>
              <div class="form-control">
                <select id="exam-level" class="form-select" v-model="currentPaper.level">
                  <option :value="null" disabled selected>请选择技能等级</option>
                  <option v-for="level in levelOptions" :key="level.id" :value="level.name">{{ level.name }}</option>
                </select>
              </div>
            </div>

            <!-- 题库选择 -->
            <div class="form-row">
              <label>题库选择</label>
              <div class="form-control">
                <button type="button" class="btn btn-select-question" @click="showQuestionSelector">
                  选择题库题目
                </button>
                <div v-if="selectedQuestions.length > 0" class="selected-questions-summary">
                  <h4>已选题目 ({{ selectedQuestions.length }}题)</h4>
                  <div class="question-type-summary">
                    <div v-for="(summary, type) in questionTypeSummary" :key="type" class="summary-item">
                      <span class="type-name">{{ type }}</span>
                      <span class="count">{{ summary.count }}题</span>
                      <span class="total-score">总分: {{ summary.totalScore }}分</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- 描述 -->
            <div class="form-row">
              <label for="paper-desc">描述</label>
              <div class="form-control">
                <textarea id="paper-desc" class="form-textarea" v-model="currentPaper.desc"
                  placeholder="请输入描述"></textarea>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" @click="closeModal">取消</button>
            <button class="btn btn-primary" @click="savePaper" :disabled="isSaving">{{ isSaving ? '保存中...' : '确定'
            }}</button>
          </div>
        </div>
      </div>

      <!-- 单个派发模态框 -->
      <div class="modal-overlay" v-if="isDispatchModalVisible" @click="closeDispatchModal">
        <div class="modal-container" @click.stop>
          <div class="modal-header">
            <h3>派发试卷</h3>
            <button class="close-btn" @click="closeDispatchModal">&times;</button>
          </div>
          <div class="modal-body">
            <div class="form-row">
              <label>考试日期</label>
              <div class="date-time-inputs">
                <div class="date-time-group">
                  <label class="small-label">开始日期</label>
                  <input type="datetime-local" class="form-input" v-model="dispatchData.startTime" />
                </div>
                <div class="date-time-group">
                  <label class="small-label">结束日期</label>
                  <input type="datetime-local" class="form-input" :class="{ 'input-error': dateValidationError }"
                    v-model="dispatchData.endTime" />
                </div>
                <div v-if="dateValidationError" class="validation-error">{{ dateValidationError }}</div>
              </div>
            </div>

            <div class="form-row">
              <label>考试时长</label>
              <div class="form-control number-input-container">
                <input type="number" class="form-input number-input" v-model="dispatchData.duration" />
                <span class="unit">分钟</span>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" @click="closeDispatchModal">取消</button>
            <button class="btn btn-primary" @click="dispatchPaper" :disabled="isDispatching">{{ isDispatching ? '派发中...'
              :
              '确定' }}</button>
          </div>
        </div>
      </div>

      <!-- 批量派发模态框 -->
      <div class="modal-overlay" v-if="isMultiDispatchModalVisible" @click="closeMultiDispatchModal">
        <div class="modal-container" @click.stop>
          <div class="modal-header">
            <h3>批量派发试卷 ({{ selectedPapers.length }}份)</h3>
            <button class="close-btn" @click="closeMultiDispatchModal">&times;</button>
          </div>
          <div class="modal-body">
            <div class="selected-papers-list">
              <div class="selected-papers-header">已选试卷：</div>
              <div class="selected-papers-container">
                <div v-for="(paper, index) in selectedPapers" :key="index" class="selected-paper-item">
                  <span class="paper-info">{{ paper.jobType }} - {{ paper.level }}</span>
                  <span class="paper-status"
                    :class="paper.status === 1 ? 'status-dispatched' : 'status-not-dispatched'">
                    {{ paper.status === 1 ? '已派发' : '未派发' }}
                  </span>
                  <button class="remove-btn" @click="removePaperFromSelection(paper)">&times;</button>
                </div>
              </div>
            </div>

            <div class="form-row">
              <label>考试时长</label>
              <div class="form-control number-input-container">
                <input type="number" class="form-input number-input" v-model="multiDispatchData.duration" />
                <span class="unit">分钟</span>
              </div>
            </div>

            <div class="form-row">
              <label>考试日期</label>
              <div class="date-time-inputs">
                <div class="date-time-group">
                  <label class="small-label">开始日期</label>
                  <input type="datetime-local" class="form-input" v-model="multiDispatchData.startTime" />
                </div>
                <div class="date-time-group">
                  <label class="small-label">结束日期</label>
                  <input type="datetime-local" class="form-input" :class="{ 'input-error': multiDateValidationError }"
                    v-model="multiDispatchData.endTime" />
                </div>
                <div v-if="multiDateValidationError" class="validation-error">{{ multiDateValidationError }}</div>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" @click="closeMultiDispatchModal">取消</button>
            <button class="btn btn-primary" @click="dispatchMultiplePapers" :disabled="isMultiDispatching">{{
              isMultiDispatching ? '派发中...' : '确定' }}</button>
          </div>
        </div>
      </div>

      <!-- 手动组卷模态框 -->
      <div class="modal-overlay" v-if="isManualModalVisible" @click="closeManualModal">
        <div class="modal-container" @click.stop>
          <div class="modal-header">
            <h3>手动组卷</h3>
            <button class="close-btn" @click="closeManualModal">&times;</button>
          </div>
          <div class="modal-body">
            <!-- 职业(工种) -->
            <div class="form-row">
              <label for="manual-position-select">职业(工种)</label>
              <div class="form-control">
                <select id="manual-position-select" class="form-select" v-model="currentPaper.jobType">
                  <option value disabled selected>请选择职业(工种)</option>
                  <option v-for="position in positionOptions" :key="position.id" :value="position.name">{{ position.name
                  }}
                  </option>
                </select>
              </div>
            </div>

            <!-- 技能等级 -->
            <div class="form-row">
              <label for="manual-exam-level">技能等级</label>
              <div class="form-control">
                <select id="manual-exam-level" class="form-select" v-model="currentPaper.level">
                  <option :value="null" disabled selected>请选择技能等级</option>
                  <option v-for="level in levelOptions" :key="level.id" :value="level.name">{{ level.name }}</option>
                </select>
              </div>
            </div>

            <!-- 手动组卷特殊功能区域 -->
            <div class="manual-paper-section">
              <h4>手动组卷功能</h4>
              <p class="manual-paper-hint">手动组卷功能正在开发中，敬请期待...</p>
              <div class="manual-paper-placeholder">
                <div class="placeholder-item">
                  <span class="placeholder-icon">📝</span>
                  <span>手动选择题目</span>
                </div>
                <div class="placeholder-item">
                  <span class="placeholder-icon">⚙️</span>
                  <span>自定义题目顺序</span>
                </div>
                <div class="placeholder-item">
                  <span class="placeholder-icon">📊</span>
                  <span>灵活设置分值</span>
                </div>
              </div>
            </div>

            <!-- 描述 -->
            <div class="form-row">
              <label for="manual-paper-desc">描述</label>
              <div class="form-control">
                <textarea id="manual-paper-desc" class="form-textarea" v-model="currentPaper.desc"
                  placeholder="请输入描述"></textarea>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" @click="closeManualModal">取消</button>
            <button class="btn btn-primary" @click="saveManualPaper" :disabled="isSaving">{{ isSaving ? '保存中...' : '确定'
            }}</button>
          </div>
        </div>
      </div>

      <!-- 下载设置模态框 -->
      <div class="modal-overlay" v-if="isDownloadModalVisible" @click="closeDownloadModal">
        <div class="modal-container download-modal" @click.stop>
          <div class="modal-header">
            <h3>下载设置</h3>
            <button class="close-btn" @click="closeDownloadModal">&times;</button>
          </div>
          <div class="modal-body">
            <!-- Logo上传 -->
            <div class="form-row">
              <label>试卷Logo</label>
              <div class="form-control">
                <div class="logo-upload-area" @click="triggerLogoInput" @drop="handleLogoDrop" @dragover.prevent
                  @dragenter.prevent :class="{ 'drag-over': isLogoDragOver }">
                  <div v-if="!downloadSettings.logoUrl" class="logo-upload-placeholder">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                      <path d="M14 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.9 22 6 22H18C19.1 22 20 21.1 20 20V8L14 2Z"
                        stroke="currentColor" stroke-width="2" />
                      <path d="M14 2V8H20" stroke="currentColor" stroke-width="2" />
                      <path d="M16 13H8" stroke="currentColor" stroke-width="2" />
                      <path d="M16 17H8" stroke="currentColor" stroke-width="2" />
                      <path d="M10 9H8" stroke="currentColor" stroke-width="2" />
                    </svg>
                    <p>点击或拖拽上传Logo</p>
                    <p class="logo-hint">支持 JPG、PNG 格式，建议尺寸 200x200px</p>
                  </div>
                  <div v-else class="logo-preview">
                    <img :src="downloadSettings.logoUrl" alt="Logo预览" />
                    <button class="remove-logo-btn" @click="removeLogo">&times;</button>
                  </div>
                  <input ref="logoInput" type="file" accept="image/*" @change="handleLogoSelect"
                    style="display: none" />
                </div>
              </div>
            </div>

            <!-- 考试题名 -->
            <div class="form-row">
              <label>考试题名</label>
              <div class="form-control">
                <input type="text" class="form-input" v-model="downloadSettings.examTitle"
                  placeholder="请输入考试题名，如：2024年技能等级考试" />
              </div>
            </div>

            <!-- 试卷大小选择 -->
            <div class="form-row">
              <label>试卷大小</label>
              <div class="form-control">
                <div class="paper-size-simple">
                  <label class="size-option-simple">
                    <input type="radio" v-model="downloadSettings.paperSize" value="A4" />
                    <span>A4 (答案卷)</span>
                  </label>
                  <label class="size-option-simple">
                    <input type="radio" v-model="downloadSettings.paperSize" value="A3" />
                    <span>A3 (考核卷)</span>
                  </label>
                </div>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" @click="closeDownloadModal">取消</button>
            <button class="btn btn-primary" @click="confirmDownload" :disabled="isDownloading">
              {{ isDownloading ? '下载中...' : '确认下载' }}
            </button>
          </div>
        </div>
      </div>

      <!-- 题库选择模态框 -->
      <div class="modal-overlay" v-if="isQuestionSelectorVisible" @click="closeQuestionSelector">
        <div class="modal-container question-selector-modal" @click.stop>
          <div class="modal-header">
            <h3>题库选择</h3>
            <button class="close-btn" @click="closeQuestionSelector">&times;</button>
          </div>
          <div class="modal-body">
            <!-- 题型筛选 -->
            <div class="question-type-filter">
              <h4>题型筛选</h4>
              <div class="filter-buttons">
                <button v-for="type in questionTypeList" :key="type" class="filter-btn"
                  :class="{ active: selectedQuestionType === type }" @click="selectQuestionType(type)">
                  {{ type }}
                </button>
              </div>
            </div>

            <!-- 题目列表 -->
            <div class="questions-container">
              <div class="questions-header">
                <h4>{{ selectedQuestionType }}题目</h4>
                <div class="questions-actions">
                  <button class="btn btn-primary" @click="selectAllQuestions">全选</button>
                  <button class="btn btn-secondary" @click="clearSelection">清空</button>
                </div>
              </div>

              <div class="questions-list">
                <div v-for="question in filteredQuestions" :key="question.id" class="question-item"
                  :class="{ selected: isQuestionSelected(question) }" @click="toggleQuestionSelection(question)">
                  <div class="question-header">
                    <div class="question-info">
                      <span class="question-type">{{ question.questionType }}</span>
                      <span class="question-id">ID: {{ question.id }}</span>
                    </div>
                    <div class="question-score">
                      <input type="number" v-model="questionScores[question.id]" min="0" max="100" step="0.5"
                        class="score-input" placeholder="分数" @click.stop />
                    </div>
                  </div>
                  <div class="question-content" v-html="renderQuestionContent(question)"></div>
                  <div v-if="question.answer" class="question-answer">
                    <strong>答案:</strong> {{ formatAnswer(question.answer, question.questionType) }}
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" @click="closeQuestionSelector">取消</button>
            <button class="btn btn-primary" @click="confirmQuestionSelection">确定</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, nextTick } from "vue";
import {
  getAllBaseQuestions,
  constructExam,
  updateExam,
  distributeExam,
  deleteBatchExam,
  deleteExam,
  getExamList,
  getAllClasses,
  getDictionaryByType,
  selectQuestionByBaseID,
  getAllExamPaper,
  exportExamWordNew,
  downloadFile // 新增下载文件接口
} from "@/api/user";
import { getAllExamStations } from "@/api/examStation";
import { ElMessage } from "element-plus";
import { getFullImageUrl } from '@/api/imageUpload.js';

// 从sessionStorage获取选项数据
const getOptionsFromStorage = (key, defaultOptions = []) => {
  try {
    const storedData = sessionStorage.getItem(key);
    return storedData ? JSON.parse(storedData) : defaultOptions;
  } catch (error) {
    console.error(`获取${key}数据失败:`, error);
    return defaultOptions;
  }
};

// 年级、专业和班级选项
const gradeOptions = ref(getOptionsFromStorage("gradeOptions", []));
const majorOptions = ref(getOptionsFromStorage("majorOptions", []));
const classOptions = ref(getOptionsFromStorage("classOptions", []));
const positionOptions = ref([]); // 职业(工种)
const levelOptions = ref([]); // 技能等级选项

// 考核站相关状态
const examStations = ref([]);
const loadingExamStations = ref(false);

// 状态变量
const isSaving = ref(false);
const isDispatching = ref(false);
const isMultiDispatching = ref(false);
const isLoading = ref(true);
const error = ref(null);

const selectedClassInfo = ref(null);

// 试卷数据
const papers = ref([]);

// 搜索和分页
const currentPage = ref(1);
const pageSize = ref(10);
const totalItems = ref(0);
const totalPages = computed(() => Math.ceil(totalItems.value / pageSize.value));

// 题目详情二级页相关状态
const showPaperDetail = ref(false);
const currentPaperDetail = ref(null);
const questionList = ref([]);
const isLoadingQuestions = ref(false);
const questionsError = ref(null);
const questionCurrentPage = ref(1);
const questionPageSize = ref(10);
const questionTotal = ref(0);

const paginatedQuestions = computed(() => questionList.value);

// 题型分组映射
const questionTypeMap = {
  singleChoice: "单选题",
  multiChoice: "多选题",
  decide: "判断题",
  fillBlank: "填空题",
  shortAnswer: "简答题",
  comprehensive: "综合题"
};

// 题型识别
function getQuestionSubType(q) {
  // 兼容数字、英文key、中文题型
  if (typeof q.questionType === "string") {
    switch (q.questionType) {
      case "singleChoice":
        return "singleChoice";
      case "multiChoice":
        return "multiChoice";
      case "decide":
        return "decide";
      case "fillBlank":
        return "fillBlank";
      case "shortAnswer":
        return "shortAnswer";
      case "comprehensive":
        return "comprehensive";
    }
  }
  switch (q.questionType) {
    case 0:
      return "singleChoice";
    case 1:
      return "multiChoice";
    case 2:
      return "decide";
    case 3:
      return "fillBlank";
    case 4:
      return "shortAnswer";
    case 5:
      return "comprehensive";
    default:
      return "singleChoice";
  }
}

const groupedQuestions = computed(() => {
  const groups = {
    singleChoice: [],
    multiChoice: [],
    decide: [],
    fillBlank: [],
    shortAnswer: [],
    comprehensive: []
  };
  questionList.value.forEach(q => {
    const type = getQuestionSubType(q);
    if (groups[type]) groups[type].push(q);
  });
  return groups;
});

// 题型统计信息
const questionTypeSummary = computed(() => {
  // 如果是题库选择模式，使用selectedQuestions
  if (selectedQuestions.value.length > 0) {
    const summary = {};
    selectedQuestions.value.forEach(question => {
      const type = question.questionType;
      if (!summary[type]) {
        summary[type] = { count: 0, totalScore: 0 };
      }
      summary[type].count++;
      summary[type].totalScore += questionScores.value[question.id] || question.score || 0;
    });
    return summary;
  }

  // 原有的试卷详情统计逻辑
  const summary = [];
  const typeMap = {
    singleChoice: "单项选择题",
    multiChoice: "多项选择题",
    decide: "判断题",
    fillBlank: "填空题",
    shortAnswer: "简答题",
    comprehensive: "综合题"
  };

  Object.entries(groupedQuestions.value).forEach(([key, questions]) => {
    if (questions.length > 0) {
      // 根据题型计算默认分值
      let defaultScore = 2; // 默认分值
      switch (key) {
        case 'singleChoice':
          defaultScore = 2;
          break;
        case 'multiChoice':
          defaultScore = 4;
          break;
        case 'decide':
          defaultScore = 1;
          break;
        case 'fillBlank':
          defaultScore = 2;
          break;
        case 'shortAnswer':
          defaultScore = 5;
          break;
        case 'comprehensive':
          defaultScore = 10;
          break;
      }

      summary.push({
        type: typeMap[key],
        count: questions.length,
        totalScore: questions.length * defaultScore
      });
    }
  });

  return summary;
});

// 总题目数和总分
const totalQuestionCount = computed(() => {
  if (selectedQuestions.value.length > 0) {
    // 题库选择模式：从对象中计算总数
    return Object.values(questionTypeSummary.value).reduce((total, item) => total + item.count, 0);
  } else {
    // 试卷详情模式：从数组中计算总数
    return questionTypeSummary.value.reduce((total, item) => total + item.count, 0);
  }
});

const totalScore = computed(() => {
  if (selectedQuestions.value.length > 0) {
    // 题库选择模式：从对象中计算总分
    return Object.values(questionTypeSummary.value).reduce((total, item) => total + item.totalScore, 0);
  } else {
    // 试卷详情模式：从数组中计算总分
    return questionTypeSummary.value.reduce((total, item) => total + item.totalScore, 0);
  }
});

// 获取试卷列表
const fetchPapers = async () => {
  isLoading.value = true;
  error.value = null;

  try {
    const searchInfo = {
      name: "", // 可以添加搜索功能
      offset: (currentPage.value - 1) * pageSize.value, // 计算偏移量
      limit: pageSize.value
    };

    const response = await getExamList(searchInfo);

    if (response && response.code === 200) {
      papers.value = response.data.list || [];
      totalItems.value = response.data.total || 0;
    } else {
      throw new Error(response?.msg || "获取组卷列表失败");
    }
  } catch (err) {
    console.error("获取组卷列表失败:", err);
    error.value = err.message || "获取组卷列表失败，请稍后重试";
  } finally {
    isLoading.value = false;
  }
};

// 考核站映射函数
const getStationName = (stationId) => {
  if (!stationId) return '-';
  const station = examStations.value.find(s => s.id === stationId);
  return station ? station.stationName : '未知考核站';
};

// 获取考核站列表
const fetchExamStations = async () => {
  if (examStations.value.length > 0) return; // 已经加载过了
  
  loadingExamStations.value = true;
  try {
    const response = await getAllExamStations();
    const responseData = response.data || {};
    
    if (responseData && responseData.code === 200) {
      examStations.value = responseData.data || [];
    } else {
      console.error('获取考核站列表失败:', responseData?.msg);
    }
  } catch (error) {
    console.error('获取考核站列表失败:', error);
  } finally {
    loadingExamStations.value = false;
  }
};

// 模态框状态
const isModalVisible = ref(false);
const isEditMode = ref(false);
const isManualMode = ref(false); // 新增：区分手动组卷模式
const isManualModalVisible = ref(false); // 新增：手动组卷模态框状态

// 当前编辑的试卷
const currentPaper = ref({
  id: null,
  teachId:
    localStorage.getItem("teachId") || "979af1bdc0d04ab78879c46e0d07560c", // 默认教师ID
  level: null,
  jobType: "",
  desc: ""
});

// 题型配置
const questionTypes = ref([
  { name: "填空题", count: 5, score: 2 },
  { name: "单项选择题", count: 10, score: 2 },
  { name: "多项选择题", count: 5, score: 4 },
  { name: "判断题", count: 10, score: 1 },
  { name: "简答题", count: 3, score: 5 },
  { name: "综合题", count: 2, score: 10 }
]);

// 多选相关状态
const selectedPapers = ref([]);
const isAllSelected = computed(() => {
  return (
    paginatedPapers.value.length > 0 &&
    paginatedPapers.value.every(paper => isPaperSelected(paper))
  );
});

// 检查试卷是否被选中
const isPaperSelected = paper => {
  return selectedPapers.value.some(p => p.id === paper.id);
};

// 切换选择所有试卷
const toggleSelectAll = () => {
  if (isAllSelected.value) {
    // 取消选择当前页所有试卷
    paginatedPapers.value.forEach(paper => {
      const index = selectedPapers.value.findIndex(p => p.id === paper.id);
      if (index !== -1) {
        selectedPapers.value.splice(index, 1);
      }
    });
  } else {
    // 选择当前页所有试卷，包括已派发的
    paginatedPapers.value.forEach(paper => {
      if (!isPaperSelected(paper)) {
        selectedPapers.value.push({ ...paper });
      }
    });
  }
};

// 切换单个试卷选择状态
const togglePaperSelection = paper => {
  const index = selectedPapers.value.findIndex(p => p.id === paper.id);

  if (index !== -1) {
    // 已选中，取消选择
    selectedPapers.value.splice(index, 1);
  } else {
    // 未选中，添加到选择列表
    selectedPapers.value.push({ ...paper });
  }
};

// 从选择列表中移除试卷
const removePaperFromSelection = paper => {
  const index = selectedPapers.value.findIndex(p => p.id === paper.id);

  if (index !== -1) {
    selectedPapers.value.splice(index, 1);
  }
};

// 当前页显示的试卷数据
const paginatedPapers = computed(() => {
  return papers.value;
});

// 计算显示哪些页码
const displayedPages = computed(() => {
  const pages = [];
  const maxVisiblePages = 5;

  if (totalPages.value <= maxVisiblePages) {
    for (let i = 1; i <= totalPages.value; i++) {
      pages.push(i);
    }
  } else {
    pages.push(1);

    let startPage = Math.max(
      2,
      currentPage.value - Math.floor((maxVisiblePages - 3) / 2)
    );
    let endPage = Math.min(
      totalPages.value - 1,
      startPage + maxVisiblePages - 4
    );

    if (endPage - startPage + 1 < maxVisiblePages - 3) {
      startPage = Math.max(2, endPage - (maxVisiblePages - 4) + 1);
    }

    if (startPage > 2) {
      pages.push("...");
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    if (endPage < totalPages.value - 1) {
      pages.push("...");
    }

    pages.push(totalPages.value);
  }

  return pages;
});

// 单个派发模态框状态
const isDispatchModalVisible = ref(false);
const selectedPaper = ref(null);
const dispatchData = ref({
  startTime: "",
  endTime: "",
  duration: 60
});

// 批量派发模态框状态
const isMultiDispatchModalVisible = ref(false);
const multiDispatchData = ref({
  startTime: "",
  endTime: "",
  duration: 60
});

const dateValidationError = ref("");
const multiDateValidationError = ref("");

// 监听批量派发的开始和结束时间变化
watch(
  [
    () => multiDispatchData.value.startTime,
    () => multiDispatchData.value.endTime
  ],
  () => {
    // Clear previous validation error
    multiDateValidationError.value = "";

    if (multiDispatchData.value.startTime && multiDispatchData.value.endTime) {
      const startTime = new Date(multiDispatchData.value.startTime);
      const endTime = new Date(multiDispatchData.value.endTime);

      if (endTime <= startTime) {
        multiDateValidationError.value = "考试结束日期不能小于或等于开始日期";
        return;
      }

      // 移除自动计算时长的代码
    }
  },
  { immediate: true }
);

// 同样修复单个派发的时间计算逻辑
watch(
  [() => dispatchData.value.startTime, () => dispatchData.value.endTime],
  () => {
    // Clear previous validation error
    dateValidationError.value = "";

    if (dispatchData.value.startTime && dispatchData.value.endTime) {
      const startTime = new Date(dispatchData.value.startTime);
      const endTime = new Date(dispatchData.value.endTime);

      if (endTime <= startTime) {
        dateValidationError.value = "考试结束日期不能小于或等于开始日期";
        return;
      }

      // 移除自动计算时长的代码
    }
  },
  { immediate: true }
);

// 显示单个派发模态框
const showDispatchModal = paper => {
  selectedPaper.value = paper;

  // 设置默认开始时间为当前时间
  const now = new Date();
  const startTime = new Date(now);
  startTime.setMinutes(0); // 将分钟设为0
  startTime.setSeconds(0); // 将秒设为0

  // 设置默认结束时间为开始时间后24小时
  const endTime = new Date(startTime);
  endTime.setDate(endTime.getDate() + 1);

  // 格式化为datetime-local输入框所需的格式 (YYYY-MM-DDTHH:MM)
  dispatchData.value.startTime = formatDateForInput(startTime);
  dispatchData.value.endTime = formatDateForInput(endTime);
  dispatchData.value.duration = 60; // 默认60分钟

  isDispatchModalVisible.value = true;
};

// 显示批量派发模态框
const showMultiDispatchModal = () => {
  // 检查是否有选中的试卷
  if (selectedPapers.value.length === 0) {
    ElMessage.warning("请先选择要派发的试卷");
    return;
  }

  // 设置默认开始时间为当前时间
  const now = new Date();
  const startTime = new Date(now);
  startTime.setMinutes(0); // 将分钟设为0
  startTime.setSeconds(0); // 将秒设为0

  // 设置默认结束时间为开始时间后24小时
  const endTime = new Date(startTime);
  endTime.setDate(endTime.getDate() + 1);

  // 格式化为datetime-local输入框所需的格式 (YYYY-MM-DDTHH:MM)
  multiDispatchData.value.startTime = formatDateForInput(startTime);
  multiDispatchData.value.endTime = formatDateForInput(endTime);
  multiDispatchData.value.duration = 60; // 默认60分钟

  isMultiDispatchModalVisible.value = true;
};

// 关闭单个派发模态框
const closeDispatchModal = () => {
  isDispatchModalVisible.value = false;
  selectedPaper.value = null;
};

// 关闭批量派发模态框
const closeMultiDispatchModal = () => {
  isMultiDispatchModalVisible.value = false;
};

// 格式化日期为input[type="datetime-local"]所需的格式
const formatDateForInput = date => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

// 格式化日期为API所需的格式 (YYYYMMDDHHmmss)
const formatDateForApi = dateString => {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");

  return `${year}${month}${day}${hours}${minutes}${seconds}`;
};

// 派发单个试卷
const dispatchPaper = async () => {
  // Validate form
  if (!dispatchData.value.startTime) {
    ElMessage.warning("请选择开始时间");
    return;
  }

  if (!dispatchData.value.endTime) {
    ElMessage.warning("请选择结束时间");
    return;
  }

  if (dateValidationError.value) {
    ElMessage.warning(dateValidationError.value);
    return;
  }

  isDispatching.value = true;

  try {
    // 准备API请求数据
    const distributeData = {
      idList: [selectedPaper.value.id],
      startTime: formatDateForApi(dispatchData.value.startTime),
      endTime: formatDateForApi(dispatchData.value.endTime),
      consume: dispatchData.value?.duration?.toString() || ""
    };

    // 调用API
    const response = await distributeExam(distributeData);

    if (response && response.code === 200) {
      ElMessage.success("试卷派发成功");

      fetchPapers();
      closeDispatchModal();
    } else {
      throw new Error(response?.msg || "派发试卷失败");
    }
  } catch (error) {
    console.error("派发试卷失败:", error);
    ElMessage.error(error.message || "派发试卷失败，请稍后重试");
  } finally {
    isDispatching.value = false;
  }
};

// 批量派发试卷
const dispatchMultiplePapers = async () => {
  // Validate form
  if (!multiDispatchData.value.startTime) {
    ElMessage.warning("请选择开始时间");
    return;
  }

  if (!multiDispatchData.value.endTime) {
    ElMessage.warning("请选择结束时间");
    return;
  }

  if (multiDateValidationError.value) {
    ElMessage.warning(multiDateValidationError.value);
    return;
  }

  // 使用所有选中的试卷，不限制派发状态
  const papersToDispatch = selectedPapers.value;

  if (papersToDispatch.length === 0) {
    ElMessage.warning("请先选择要派发的试卷");
    return;
  }

  isMultiDispatching.value = true;

  try {
    // 准备API请求数据
    const distributeData = {
      idList: papersToDispatch.map(paper => paper.id),
      startTime: formatDateForApi(multiDispatchData.value.startTime),
      endTime: formatDateForApi(multiDispatchData.value.endTime),
      consume: multiDispatchData.value?.duration?.toString() || ""
    };

    // 调用API
    const response = await distributeExam(distributeData);

    if (response && response.code === 200) {
      ElMessage.success(`成功派发 ${papersToDispatch.length} 份试卷！`);
      selectedPapers.value = [];
      fetchPapers();
      closeMultiDispatchModal();
    } else {
      throw new Error(response?.msg || "批量派发试卷失败");
    }
  } catch (error) {
    console.error("批量派发试卷失败:", error);
    ElMessage.error(error.message || "批量派发试卷失败，请稍后重试");
  } finally {
    isMultiDispatching.value = false;
  }
};

// 方法
const goToPage = page => {
  if (page < 1 || page > totalPages.value) return;
  currentPage.value = page;
  fetchPapers();
};

const handlePageSizeChange = () => {
  currentPage.value = 1; // 改变每页显示数量后回到第一页
  fetchPapers();
};

const showAddModal = async () => {
  isEditMode.value = false;
  isManualMode.value = false; // 自动组卷模式
  const users = JSON.parse(sessionStorage.getItem("user") || "{}");
  const teacherId = users.id;
  currentPaper.value = {
    id: null,
    teachId: teacherId,
    level: null,
    jobType: "",
    desc: ""
  };

  // 重置题型配置为默认值
  questionTypes.value = [
    { name: "填空题", count: 5, score: 2 },
    { name: "单项选择题", count: 10, score: 2 },
    { name: "多项选择题", count: 5, score: 4 },
    { name: "判断题", count: 10, score: 1 },
    { name: "简答题", count: 3, score: 5 },
    { name: "综合题", count: 2, score: 10 }
  ];

  // 获取职位数据
  try {
    ElMessage.info("正在加载选项数据...");
    await Promise.all([fetchPositionOptions(), fetchLevelOptions()]);
  } catch (error) {
    console.error("加载选项数据失败:", error);
    ElMessage.error(`加载选项数据失败: ${error.message || "未知错误"}`);
  }

  isModalVisible.value = true;
};

// 显示手动组卷全页面
const showManualAddModal = async () => {
  isEditMode.value = false;
  isManualMode.value = true; // 手动组卷模式
  const users = JSON.parse(sessionStorage.getItem("user") || "{}");
  const teacherId = users.id;
  currentPaper.value = {
    id: null,
    teachId: teacherId,
    level: null,
    jobType: "",
    desc: "",
    createTime: new Date().toISOString().slice(0, 19).replace('T', ' ')
  };

  // 初始化题目选择状态
  selectedQuestions.value = [];
  questionScores.value = {};
  selectedQuestionType.value = "填空题"; // 默认选择填空题

  // 获取职位数据
  try {
    ElMessage.info("正在加载选项数据...");
    await Promise.all([fetchPositionOptions(), fetchLevelOptions()]);
  } catch (error) {
    console.error("加载选项数据失败:", error);
    ElMessage.error(`加载选项数据失败: ${error.message || "未知错误"}`);
  }

  // 显示手动组卷全页面
  showManualPaperPage.value = true;

  // 加载题目数据
  await loadQuestions();
};

// 查看试卷
const viewPaper = async paper => {
  showPaperDetail.value = true;
  currentPaperDetail.value = paper;
  isLoadingQuestions.value = true;
  questionsError.value = null;
  questionCurrentPage.value = 1;
  try {
    const response = await getAllExamPaper(paper.id);
    if (response && response.code === 200 && response.data) {
      const allQuestions = [];
      const typeMap = {
        singleChoice: "singleChoice",
        multiChoice: "multiChoice",
        decide: "decide",
        fillBank: "fillBlank",
        shortAnswer: "shortAnswer",
        comprehensive: "comprehensive"
      };
      Object.entries(typeMap).forEach(([apiKey, localType]) => {
        const arr = response.data[apiKey];
        if (Array.isArray(arr)) {
          arr.forEach(q => {
            allQuestions.push({ ...q, questionType: localType });
          });
        }
      });
      questionList.value = allQuestions;
      questionTotal.value = allQuestions.length;
      // 处理题目图片和选项图片
      await processQuestionImages(allQuestions);
    } else {
      throw new Error(response?.msg || "获取题目详情失败");
    }
  } catch (err) {
    questionsError.value = err.message || "获取题目详情失败，请稍后重试";
  } finally {
    isLoadingQuestions.value = false;
  }
};

const editPaper = async paper => {
  isEditMode.value = true;
  isManualMode.value = false; // 编辑模式下不是手动组卷
  const users = JSON.parse(sessionStorage.getItem("user") || "{}");
  const teacherId = users.id;

  currentPaper.value = {
    id: paper.id,
    teachId: teacherId,
    level: paper.level || null,
    jobType: paper.jobType || "",
    desc: paper.desc || ""
  };

  // 获取职位数据
  try {
    ElMessage.info("正在加载选项数据...");
    await Promise.all([fetchPositionOptions(), fetchLevelOptions()]);
  } catch (error) {
    console.error("加载选项数据失败:", error);
    ElMessage.error(`加载选项数据失败: ${error.message || "未知错误"}`);
  }

  isModalVisible.value = true;
};

const closeModal = () => {
  isModalVisible.value = false;
  isManualMode.value = false; // 重置手动组卷模式
};

// 关闭手动组卷模态框
const closeManualModal = () => {
  isManualModalVisible.value = false;
  isManualMode.value = false;
};

const savePaper = async () => {
  // 验证表单
  if (!currentPaper.value.jobType) {
    ElMessage.warning("请选择职业(工种)");
    return;
  }
  if (!currentPaper.value.level) {
    ElMessage.warning("请选择技能等级");
    return;
  }

  // 验证题型配置
  const validTypes = questionTypes.value.filter(type => type.count > 0);
  if (validTypes.length === 0) {
    ElMessage.warning("请至少为一种题型设置题目数量");
    return;
  }

  // 验证每种题型的数量
  for (const type in questionTypes.value) {
    if (type.count > 0 && (!type.score || type.score <= 0)) {
      ElMessage.warning(`请为${type.name}设置每题分值`);
      return;
    }
  }

  isSaving.value = true;

  try {
    let response;
    if (isEditMode.value) {
      // 编辑现有试卷
      const apiData = {
        id: currentPaper.value.id,
        jobType: currentPaper.value.jobType,
        level: currentPaper.value.level,
        desc: currentPaper.value.desc
      };
      response = await updateExam(apiData);
    } else {
      // 添加新试卷 - 手动组卷
      const apiData = {
        jobType: currentPaper.value.jobType,
        level: currentPaper.value.level,
        desc: currentPaper.value.desc
      };
      response = await constructExam(apiData);
    }

    if (response && response.code === 200) {
      ElMessage.success(isEditMode.value ? "试卷更新成功" : "手动组卷成功");
      closeModal();

      // 刷新试卷列表
      fetchPapers();
    } else {
      throw new Error(
        response?.msg || (isEditMode.value ? "更新试卷失败" : "手动组卷失败")
      );
    }
  } catch (error) {
    console.error(isEditMode.value ? "更新试卷失败:" : "手动组卷失败:", error);
    ElMessage.error(
      error.message ||
      (isEditMode.value ? "更新试卷失败，请稍后重试" : "手动组卷失败，请稍后重试")
    );
  } finally {
    isSaving.value = false;
  }
};

const deletePaper = async paper => {
  if (confirm(`确定要删除这份试卷吗？`)) {
    try {
      const response = await deleteExam(paper.id.toString());

      if (response && response.code === 200) {
        const index = papers.value.findIndex(p => p.id === paper.id);
        if (index !== -1) {
          papers.value.splice(index, 1);

          // 同时从选中列表中移除
          removePaperFromSelection(paper);

          // 如果当前页没有数据了，且不是第一页，则回到上一页
          if (paginatedPapers.value.length === 0 && currentPage.value > 1) {
            currentPage.value--;
          }

          ElMessage.success("试卷删除成功");

          // 刷新试卷列表
          fetchPapers();
        }
      } else {
        throw new Error(response?.msg || "删除试卷失败");
      }
    } catch (error) {
      console.error("删除试卷失败:", error);
      ElMessage.error(error.message || "删除试卷失败，请稍后重试");
    }
  }
};

// 获取职位选项
const fetchPositionOptions = async () => {
  try {
    const response = await getDictionaryByType({ type: 0 }); // 假设0为职业(工种)类型
    if (response && response.code === 200 && response.data) {
      positionOptions.value = response.data.map(item => ({
        id: item.id,
        name: item.name,
        code: item.code
      }));
    } else {
      throw new Error(response?.msg || "获取职业(工种)数据失败");
    }
  } catch (err) {
    console.error("获取职业(工种)数据失败:", err);
    ElMessage.error("获取职业(工种)数据失败，请稍后重试");
  }
};

// 获取技能等级选项
const fetchLevelOptions = async () => {
  try {
    const response = await getDictionaryByType({ type: 1 }); // 假设1为技能等级类型
    if (response && response.code === 200 && response.data) {
      levelOptions.value = response.data
        .filter(item => item.name !== "职业道德")
        .map(item => ({
          id: item.id,
          name: item.name,
          code: item.code
        }));
    } else {
      throw new Error(response?.msg || "获取技能等级数据失败");
    }
  } catch (err) {
    console.error("获取技能等级数据失败:", err);
    ElMessage.error("获取技能等级数据失败，请稍后重试");
  }
};

// 查看组卷详情（题目列表）
const goBackToPaperList = () => {
  showPaperDetail.value = false;
  currentPaperDetail.value = null;
  questionList.value = [];
};

const goToQuestionPage = async page => {
  if (
    page < 1 ||
    page > Math.ceil(questionTotal.value / questionPageSize.value)
  )
    return;
  questionCurrentPage.value = page;
  isLoadingQuestions.value = true;
  questionsError.value = null;
  try {
    const params = {
      questionBaseId: currentPaperDetail.value.basePool,
      offset: (page - 1) * questionPageSize.value,
      limit: questionPageSize.value
    };
    const response = await selectQuestionByBaseID(params);
    if (response && response.code === 200) {
      questionList.value = response.data.list || [];
      questionTotal.value = response.data.total || 0;
    } else {
      throw new Error(response?.msg || "获取题目详情失败");
    }
  } catch (err) {
    questionsError.value = err.message || "获取题目详情失败，请稍后重试";
  } finally {
    isLoadingQuestions.value = false;
  }
};

const questionDisplayedPages = computed(() => {
  const pages = [];
  const total = Math.ceil(questionTotal.value / questionPageSize.value);
  const maxVisiblePages = 5;
  if (total <= maxVisiblePages) {
    for (let i = 1; i <= total; i++) pages.push(i);
  } else {
    pages.push(1);
    let startPage = Math.max(
      2,
      questionCurrentPage.value - Math.floor((maxVisiblePages - 3) / 2)
    );
    let endPage = Math.min(total - 1, startPage + maxVisiblePages - 4);
    if (endPage - startPage + 1 < maxVisiblePages - 3) {
      startPage = Math.max(2, endPage - (maxVisiblePages - 4) + 1);
    }
    if (startPage > 2) pages.push("...");
    for (let i = startPage; i <= endPage; i++) pages.push(i);
    if (endPage < total - 1) pages.push("...");
    pages.push(total);
  }
  return pages;
});

// 组件挂载时初始化数据
onMounted(async () => {
  // 先获取考核站列表
  await fetchExamStations();
  
  // 获取试卷列表
  fetchPapers();

  // 如果sessionStorage中没有数据，可以在这里添加获取数据的逻辑
  if (
    gradeOptions.value.length === 0 ||
    majorOptions.value.length === 0 ||
    classOptions.value.length === 0
  ) {
    console.warn("sessionStorage中缺少年级、专业或班级数据");
  }
});

// 下载组卷Word（兼容后端直接response输出Word流）
const downloadExamWord = async paper => {
  try {
    // axios请求，responseType: 'blob'，直接获取Word流
    const blob = await exportExamWordNew({ paperId: paper.id });
    // 文件名可自定义，也可用后端header中的filename
    const fileName = `组卷-${paper.jobType || ""}-${paper.level || ""}.docx`;
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    ElMessage.success("组卷Word下载成功");
  } catch (error) {
    console.error("下载组卷Word失败:", error);
    ElMessage.error("下载组卷Word失败，请稍后重试");
  }
};

// 获取图片URL：统一使用 /api/image/ 直接访问
const getImageUrl = async src => {
  if (!src) return "";
  if (/^https?:\/\//.test(src) || /^data:image\//.test(src) || /^blob:/.test(src)) return src;
  return getFullImageUrl(src);
};

// 处理题干中的图片src，返回渲染用的HTML
const renderQuestionContent = async content => {
  if (!content) return "";
  // 匹配所有<img src="...">，支持单引号和双引号
  const imgRegex = /<img\s+[^>]*src=["']([^"']+)["'][^>]*>/gi;
  let match;
  let result = content;
  const promises = [];
  const srcList = [];
  while ((match = imgRegex.exec(content)) !== null) {
    const src = match[1];
    // 只处理非http/https和非data:image的src
    if (!/^https?:\/\//.test(src) && !/^data:image\//.test(src)) {
      srcList.push(src);
      promises.push(getImageUrl(src));
    }
  }
  if (promises.length === 0) return content;
  const urlList = await Promise.all(promises);
  // 替换所有src
  srcList.forEach((src, idx) => {
    // 只替换第一个出现的src，防止同名图片多次替换
    result = result.replace(
      new RegExp(
        `<img([^>]*?)src=["']${src.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}["']`,
        "i"
      ),
      `<img$1src="${urlList[idx]}"`
    );
  });
  return result;
};

// 题目详情富文本HTML（每题一项）
const questionContentHtmlList = ref([]);

// 时间格式化函数
function formatDateTime(val) {
  if (!val) return '';
  // 兼容带时区的ISO字符串
  const date = new Date(val);
  if (isNaN(date.getTime())) return val;
  const pad = n => n.toString().padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

// 处理题目和选项图片的函数
const processQuestionImages = async (questions) => {
  try {
    // 处理题干内容和选项中的图片
    await Promise.all(
      questions.map(async q => {
        // 处理题干内容中的图片
        if (q.questionContent) {
          console.log("处理题干内容图片:", q.questionContent);
          try {
            const processedContent = await renderQuestionContent(q.questionContent);
            if (processedContent !== q.questionContent) {
              // 如果内容被处理过（包含图片），存储处理后的HTML
              q._questionContentHtml = processedContent;
            }
          } catch (error) {
            console.error("处理题干内容图片失败:", error);
          }
        }

        // 处理选项图片（answera, answerb, answerc, answerd等）
        const optionFields = ['answera', 'answerb', 'answerc', 'answerd', 'answere', 'answerf', 'answerg', 'answerh', 'answeri', 'answerj'];
        for (const field of optionFields) {
          if (q[field]) {
            console.log(`处理选项${field}图片:`, q[field]);
            try {
              const processedContent = await renderQuestionContent(q[field]);
              if (processedContent !== q[field]) {
                // 如果内容被处理过（包含图片），存储处理后的HTML
                q[`_${field}Html`] = processedContent;
              }
            } catch (error) {
              console.error(`处理选项${field}图片失败:`, error);
            }
          }
        }
      })
    );

    // 生成题干内容的HTML列表
    questionContentHtmlList.value = await Promise.all(
      questions.map(async q => {
        return q._questionContentHtml || q.questionContent || "";
      })
    );
  } catch (error) {
    console.error("处理题目图片失败:", error);
  }
};

// 保存手动组卷
const saveManualPaper = async () => {
  if (selectedQuestions.value.length === 0) {
    ElMessage.warning("请至少选择一道题目");
    return;
  }

  if (!currentPaper.value.jobType || !currentPaper.value.level) {
    ElMessage.warning("请填写职业(工种)和技能等级");
    return;
  }

  isSaving.value = true;

  try {
    // 准备试卷数据
    const paperData = {
      ...currentPaper.value,
      questions: selectedQuestions.value.map(q => ({
        id: q.id,
        score: questionScores.value[q.id] || getDefaultScore(q.questionType)
      }))
    };

    // 调用API保存试卷
    const response = await constructExam(paperData);

    if (response && response.code === 200) {
      ElMessage.success("手动组卷成功");
      goBackToList();
      fetchPapers(); // 刷新试卷列表
    } else {
      throw new Error(response?.msg || "手动组卷失败");
    }
  } catch (error) {
    console.error("手动组卷失败:", error);
    ElMessage.error(error.message || "手动组卷失败，请稍后重试");
  } finally {
    isSaving.value = false;
  }
};

// 下载设置模态框状态
const isDownloadModalVisible = ref(false);
const downloadSettings = ref({
  logoUrl: "",
  examTitle: "",
  paperSize: "A4"
});
const currentDownloadPaper = ref(null);
const isDownloading = ref(false);
const isLogoDragOver = ref(false);

// 处理Logo上传
const triggerLogoInput = () => {
  logoInput.value?.click();
};

const handleLogoDrop = (e) => {
  e.preventDefault();
  isLogoDragOver.value = false;
  const files = e.dataTransfer.files;
  if (files.length > 0) {
    handleLogoSelect({ target: { files } });
  }
};

const handleLogoSelect = (e) => {
  const file = e.target.files[0];
  if (file) {
    // 验证文件类型
    if (!file.type.startsWith('image/')) {
      ElMessage.error('请选择图片文件');
      return;
    }

    // 验证文件大小 (2MB)
    if (file.size > 2 * 1024 * 1024) {
      ElMessage.error('图片大小不能超过2MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      downloadSettings.value.logoUrl = e.target.result;
    };
    reader.readAsDataURL(file);
  }
};

const removeLogo = () => {
  downloadSettings.value.logoUrl = "";
};

// 显示下载设置模态框
const showDownloadModal = (paper) => {
  currentDownloadPaper.value = paper;
  downloadSettings.value = {
    logoUrl: "",
    examTitle: "",
    paperSize: "A4"
  };
  isDownloadModalVisible.value = true;
};

// 确认下载
const confirmDownload = async () => {
  isDownloading.value = true;
  try {
    // 调用下载API，传递设置参数
    const downloadParams = {
      paperId: currentDownloadPaper.value.id,
      logoUrl: downloadSettings.value.logoUrl,
      examTitle: downloadSettings.value.examTitle,
      paperSize: downloadSettings.value.paperSize
    };

    const blob = await exportExamWordNew(downloadParams);
    const fileName = `${downloadSettings.value.examTitle || '试卷'}-${currentDownloadPaper.value.jobType || ""}-${currentDownloadPaper.value.level || ""}.docx`;

    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    ElMessage.success("试卷下载成功");
    closeDownloadModal();
  } catch (error) {
    console.error("下载试卷失败:", error);
    ElMessage.error("下载试卷失败，请稍后重试");
  } finally {
    isDownloading.value = false;
  }
};

const closeDownloadModal = () => {
  isDownloadModalVisible.value = false;
  currentDownloadPaper.value = null;
};

// 文件相关
const fileInput = ref(null);
const logoInput = ref(null);

// 题库选择模态框状态
const isQuestionSelectorVisible = ref(false);
const selectedQuestionType = ref("");
const selectedQuestions = ref([]);
const questionScores = ref({});

// 题型列表
const questionTypeList = ref([
  { value: "填空题", label: "填空题" },
  { value: "单项选择题", label: "单项选择题" },
  { value: "多项选择题", label: "多项选择题" },
  { value: "判断题", label: "判断题" },
  { value: "简答题", label: "简答题" },
  { value: "综合题", label: "综合题" }
]);

// 过滤题目
const filteredQuestions = computed(() => {
  return questionList.value.filter(question => question.questionType === selectedQuestionType.value);
});

// 检查题目是否被选中
const isQuestionSelected = question => {
  return selectedQuestions.value.some(q => q.id === question.id);
};

// 切换选择所有题目
const selectAllQuestions = () => {
  const currentTypeQuestions = filteredQuestions.value;
  selectedQuestions.value = [...currentTypeQuestions];
  currentTypeQuestions.forEach(question => {
    questionScores.value[question.id] = question.score || 2;
  });
};

// 清空选择
const clearSelection = () => {
  selectedQuestions.value = [];
  questionScores.value = {};
};

// 切换单个题目选择状态
const toggleQuestionSelection = question => {
  const index = selectedQuestions.value.findIndex(q => q.id === question.id);

  if (index !== -1) {
    // 已选中，取消选择
    selectedQuestions.value.splice(index, 1);
    delete questionScores.value[question.id];
  } else {
    // 未选中，添加到选择列表
    selectedQuestions.value.push({ ...question });
    questionScores.value[question.id] = question.score || 2;
  }
};

// 确认题目选择
const confirmQuestionSelection = () => {
  isQuestionSelectorVisible.value = false;
  ElMessage.success(`已选择 ${selectedQuestions.value.length} 道题目`);
};

// 选择题型
const selectQuestionType = type => {
  selectedQuestionType.value = type;
};


// 格式化答案
const formatAnswer = (answer, questionType) => {
  if (questionType === "判断题") {
    return answer === "A" ? "正确" : "错误";
  }
  return answer;
};

// 显示题库选择模态框
const showQuestionSelector = () => {
  isQuestionSelectorVisible.value = true;
  selectedQuestionType.value = questionTypeList.value[0].value; // 默认选择第一个题型
  loadQuestions();
};

// 关闭题库选择模态框
const closeQuestionSelector = () => {
  isQuestionSelectorVisible.value = false;
  selectedQuestions.value = [];
  questionScores.value = {};
};

// 加载题目数据（需对接真实题目列表接口）
const loadQuestions = async () => {
  try {
    questionList.value = [];
  } catch (error) {
    console.error("加载题目失败:", error);
    ElMessage.error("加载题目失败");
  }
};

// 手动组卷全页面模式状态
const showManualPaperPage = ref(false);

// 返回列表页面
const goBackToList = () => {
  showManualPaperPage.value = false;
  showPaperDetail.value = false;
  selectedQuestions.value = [];
  questionScores.value = {};
};

// 获取题型标签
const getQuestionTypeLabel = (type) => {
  const typeMap = {
    "填空题": "填空题",
    "单项选择题": "单项选择题",
    "多项选择题": "多项选择题",
    "判断题": "判断题",
    "简答题": "简答题",
    "综合题": "综合题"
  };
  return typeMap[type] || type;
};

// 获取默认分数
const getDefaultScore = (questionType) => {
  const scoreMap = {
    "填空题": 2,
    "单项选择题": 2,
    "多项选择题": 4,
    "判断题": 1,
    "简答题": 5,
    "综合题": 10
  };
  return scoreMap[questionType] || 2;
};
</script>

<style scoped>
.paper-management {
  padding: 20px;
}

.page-title {
  margin-top: 0;
  margin-bottom: 20px;
  font-size: 18px;
  font-weight: 500;
}

/* 操作按钮 */
.action-buttons {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
}

.btn-add,
.btn-dispatch {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 8px 15px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.btn-add {
  background-color: #c70019;
  color: white;
}

.btn-manual {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 8px 15px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  background-color: #1890ff;
  color: white;
}

.btn-dispatch {
  background-color: #b7eb8f;

  color: white;
}

.btn-dispatch:disabled {
  background-color: #abada9;
  cursor: not-allowed;
}

.plus-icon {
  font-weight: bold;
}

/* 数据表格 */
.table-responsive {
  overflow-x: auto;
  margin-bottom: 20px;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
}

.data-table th,
.data-table td {
  padding: 12px 8px;
  text-align: left;
  border-bottom: 1px solid #f0f0f0;
}

.data-table th {
  background-color: #fafafa;
  font-weight: 500;
}

.data-table tr:nth-child(even) {
  background-color: #f9f9f9;
}

.operations {
  display: flex;
  gap: 10px;
}

.view-link {
  color: #070707;
  text-decoration: none;
}

.print-link {
  color: #c90404;
  text-decoration: none;
  margin: 0 10px;
}

.download-link {
  color: #1890ff;
  text-decoration: none;
}

.edit-link,
.delete-link {
  color: #1890ff;
  text-decoration: none;
}

.delete-link {
  color: #ff4d4f;
}

/* 复选框样式 */
.checkbox {
  width: 16px;
  height: 16px;
  cursor: pointer;
}

/* 分页 */
.pagination-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 20px;
}

.pagination {
  display: flex;
  align-items: center;
  gap: 5px;
}

.page-number,
.page-nav,
.ellipsis {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 32px;
  height: 32px;
  padding: 0 4px;
  font-size: 14px;
  border-radius: 4px;
  text-decoration: none;
  color: #333;
}

.page-number:hover,
.page-nav:hover {
  background-color: #f0f0f0;
}

.page-number.active {
  background-color: #c70019;
  color: white;
}

.ellipsis {
  cursor: default;
}

.disabled {
  opacity: 0.5;
  cursor: not-allowed;
  pointer-events: none;
}

.page-size-selector {
  display: flex;
  align-items: center;
  gap: 5px;
}

.page-size-selector select {
  padding: 4px 8px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
}

/* 模态框样式 */

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-container {
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  width: 500px;
  max-width: 90%;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  padding: 16px 24px;
  border-bottom: 1px solid #eee;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header h3 {
  margin: 0;
  font-size: 18px;
  color: #333;
}

.close-btn {
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  color: #999;
}

.modal-body {
  padding: 20px 24px;
}

.modal-footer {
  padding: 16px 24px;
  border-top: 1px solid #eee;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.form-row {
  display: flex;
  align-items: center;
  margin-bottom: 16px;
}

.form-row label {
  width: 100px;
  color: #666;
  font-size: 14px;
}

.form-control {
  flex: 1;
}

.form-hint {
  color: #999;
  font-size: 13px;
  margin: -8px 0 12px 100px;
  padding-bottom: 4px;
}

.form-select,
.form-input,
.form-textarea {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.form-textarea {
  resize: vertical;
  min-height: 80px;
}

.form-select:focus,
.form-input:focus,
.form-textarea:focus {
  outline: none;
  border-color: #409eff;
}

.question-bank {
  align-items: flex-start;
}

.question-controls {
  display: flex;
  gap: 10px;
}

.question-type {
  flex: 2;
}

.question-count {
  flex: 1;
}

.question-count input {
  text-align: center;
}

.btn {
  padding: 8px 16px;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  border: none;
}

.btn-secondary {
  background-color: #f5f5f5;
  color: #666;
}

.btn-primary {
  background-color: #c70019;
  color: white;
}

.btn-primary:hover {
  background-color: #66b1ff;
}

/* 派发模态框样式 */
.date-time-inputs {
  display: flex;
  flex-direction: column;
  gap: 12px;
  flex: 1;
}

.date-time-group {
  display: flex;
  flex-direction: column;
}

.small-label {
  font-size: 12px;
  color: #666;
  margin-bottom: 4px;
}

.number-input-container {
  display: flex;
  align-items: center;
  gap: 8px;
}

.number-input {
  width: 80px;
  text-align: center;
}

.unit {
  color: #666;
}

.dispatch-link {
  color: #52c41a;
  text-decoration: none;
  margin: 0 10px;
}

.disabled-input {
  background-color: #f5f5f5;
  color: #666;
  cursor: not-allowed;
}

.auto-calculated-hint {
  font-size: 12px;
  color: #999;
  margin-left: 5px;
}

.input-error {
  border-color: #ff4d4f;
}

.validation-error {
  color: #ff4d4f;
  font-size: 12px;
  margin-top: 4px;
}

.total-questions-display {
  margin: 10px 0 10px 100px;
  font-size: 14px;
  color: #666;
}

.total-questions-display.warning {
  color: #ff4d4f;
}

.warning-text {
  margin-left: 10px;
  font-weight: bold;
}

/* 已选试卷列表样式 */
.selected-papers-list {
  margin-bottom: 20px;
  border: 1px solid #f0f0f0;
  border-radius: 4px;
  padding: 12px;
}

.selected-papers-header {
  font-weight: 500;
  margin-bottom: 8px;
  color: #333;
}

.selected-papers-container {
  max-height: 150px;
  overflow-y: auto;
}

.selected-paper-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px;
  border-bottom: 1px solid #f0f0f0;
}

.selected-paper-item:last-child {
  border-bottom: none;
}

.paper-info {
  font-size: 14px;
  flex: 1;
}

.paper-status {
  font-size: 12px;
  padding: 2px 6px;
  border-radius: 3px;
  margin: 0 8px;
}

.status-dispatched {
  background-color: #f6ffed;
  color: #52c41a;
  border: 1px solid #b7eb8f;
}

.status-not-dispatched {
  background-color: #fff7e6;
  color: #faad14;
  border: 1px solid #ffd591;
}

.remove-btn {
  background: none;
  border: none;
  color: #ff4d4f;
  cursor: pointer;
  font-size: 16px;
  padding: 0 4px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .question-selector {
    flex-direction: column;
  }

  .question-count {
    width: 100%;
  }

  .pagination-container {
    flex-direction: column;
    gap: 10px;
    align-items: flex-start;
  }

  .pagination {
    order: 1;
  }

  .total-count {
    order: 0;
  }

  .page-size-selector {
    order: 2;
  }

  .form-row {
    flex-direction: column;
    align-items: flex-start;
  }

  .form-row label {
    width: 100%;
    margin-bottom: 8px;
  }

  .form-hint {
    margin-left: 0;
  }

  .total-questions-display {
    margin-left: 0;
  }
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #c70019;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }

  100% {
    transform: rotate(360deg);
  }
}

.error-message {
  text-align: center;
  padding: 40px;
  color: #ff4d4f;
}

.retry-btn {
  margin-top: 10px;
}

.no-data {
  text-align: center;
  color: #999;
  padding: 20px;
}

/* 题目详情二级页样式 */
.content-container {
  padding: 20px;
}

.back-button-container {
  padding: 16px;
  border-top: 1px solid #f0f0f0;
}

.top-back-button {
  padding: 12px 16px;
  border-top: none;
  border-bottom: 1px solid #f0f0f0;
  background-color: #fafafa;
}

/* 优化返回按钮样式，使其更明显 */
.top-back-button .btn-secondary {
  background-color: #ffffff;
  color: #c70019;
  border: 2px solid #c70019;
  font-weight: 500;
  padding: 10px 20px;
  transition: all 0.3s ease;
  box-shadow: 0 2px 4px rgba(199, 0, 25, 0.1);
}

.top-back-button .btn-secondary:hover {
  background-color: #c70019;
  color: #ffffff;
  box-shadow: 0 4px 8px rgba(199, 0, 25, 0.2);
  transform: translateY(-1px);
}

.exam-info-header {
  margin-bottom: 20px;
  padding: 10px;
  background-color: #f5f7fa;
  border-radius: 4px;
  border: 1px solid #ebeef5;
}

.info-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.info-item {
  display: flex;
  margin-bottom: 8px;
}

.info-label {
  width: 100px;
  color: #606266;
  font-weight: 500;
}

.info-value {
  color: #303133;
  font-weight: 500;
}

.questions-container {
  margin-bottom: 20px;
}

.question-section {
  margin-bottom: 30px;
}

.question-item {
  margin-bottom: 20px;
  padding: 15px;
  border: 1px solid #f0f0f0;
  border-radius: 4px;
  background-color: #fafafa;
}

/* 修改题目标题样式 - 题号和题干在同一行 */
.question-header-inline {
  display: flex;
  align-items: flex-start;
  margin-bottom: 10px;
  line-height: 1.5;
}

.question-number {
  font-weight: 600;
  color: #333;
  margin-right: 8px;
  flex-shrink: 0;
}

.question-text {
  flex: 1;
  color: #333;
  line-height: 1.5;
}

.question-options {
  margin: 10px 0;
  padding-left: 20px;
}

.option {
  margin-bottom: 5px;
  display: flex;
  align-items: flex-start;
}

.option-letter {
  font-weight: 500;
  margin-right: 8px;
  flex-shrink: 0;
}

.answer-item {
  margin-bottom: 5px;
  display: flex;
  align-items: flex-start;
}

.answer-label {
  font-weight: 500;
  color: #666;
  margin-right: 8px;
  flex-shrink: 0;
}

.question-divider {
  height: 1px;
  background-color: #e8e8e8;
  margin-top: 15px;
}

.questions-container table {
  width: 100%;
  border-collapse: collapse;
}

.questions-container th,
.questions-container td {
  padding: 12px 8px;
  text-align: left;
  border-bottom: 1px solid #f0f0f0;
}

.questions-container th {
  background-color: #fafafa;
  font-weight: 500;
}

.questions-container tr:nth-child(even) {
  background-color: #f9f9f9;
}

.questions-container .no-data {
  text-align: center;
  color: #999;
  padding: 20px;
}

.question-type-config {
  margin-bottom: 20px;
}

.question-type-item {
  margin-bottom: 10px;
}

.question-type-header {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
}

.question-type-name {
  font-weight: 600;
  color: #333;
  font-size: 14px;
}

.question-type-checkbox {
  margin-right: 10px;
}

.question-type-details {
  margin-top: 10px;
  padding: 10px;
  background-color: #f8f9fa;
  border-radius: 4px;
  border: 1px solid #e9ecef;
}

.question-type-row {
  display: flex;
  gap: 20px;
  align-items: center;
}

.question-type-col {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.question-type-col label {
  font-size: 12px;
  color: #666;
  margin-bottom: 0;
}

.question-count-input,
.question-score-input {
  width: 100%;
  text-align: center;
  padding: 6px 8px;
}

.manual-paper-section {
  margin-bottom: 20px;
}

.manual-paper-hint {
  font-size: 14px;
  color: #666;
  margin-bottom: 10px;
}

.manual-paper-placeholder {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.placeholder-item {
  display: flex;
  align-items: center;
  gap: 10px;
}

.placeholder-icon {
  font-size: 24px;
}

.question-type-summary {
  margin-top: 20px;
  padding: 15px;
  background-color: #f8f9fa;
  border-radius: 6px;
  border: 1px solid #e9ecef;
}

.question-type-summary h4 {
  margin: 0 0 15px 0;
  color: #333;
  font-size: 16px;
  font-weight: 600;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 15px;
  margin-bottom: 15px;
}

.summary-item {
  background-color: white;
  padding: 12px;
  border-radius: 4px;
  border: 1px solid #dee2e6;
  text-align: center;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.summary-type {
  font-weight: 600;
  color: #333;
  font-size: 14px;
  margin-bottom: 8px;
}

.summary-count,
.summary-score {
  font-size: 13px;
  color: #666;
  margin: 2px 0;
}

.summary-score {
  color: #28a745;
  font-weight: 500;
}

.summary-total {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 15px;
  padding: 12px;
  background-color: #e9ecef;
  border-radius: 4px;
  border: 1px solid #ced4da;
}

.total-label {
  font-weight: 600;
  color: #333;
  font-size: 14px;
}

.total-count,
.total-score {
  font-size: 14px;
  color: #666;
  font-weight: 500;
}

.total-score {
  color: #28a745;
}

.logo-upload-area {
  border: 2px dashed #ccc;
  border-radius: 4px;
  padding: 10px;
  text-align: center;
  cursor: pointer;
}

.logo-upload-placeholder {
  color: #ccc;
  font-size: 14px;
}

.logo-preview {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 10px;
}

.remove-logo-btn {
  background: none;
  border: none;
  color: #ff4d4f;
  cursor: pointer;
  font-size: 16px;
  padding: 0 4px;
}

.logo-hint {
  font-size: 12px;
  color: #999;
  margin-top: 5px;
}

.paper-size-options {
  display: flex;
  justify-content: space-between;
  margin-top: 10px;
}

.size-option {
  display: flex;
  align-items: center;
}

.size-label {
  margin-left: 5px;
}

.size-name {
  font-weight: 600;
}

.size-desc {
  font-size: 12px;
  color: #666;
  margin-top: 2px;
}

.preview-info {
  margin-top: 20px;
  padding: 10px;
  background-color: #f8f9fa;
  border-radius: 4px;
  border: 1px solid #e9ecef;
}

.preview-content {
  display: flex;
  flex-direction: column;
}

.preview-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.preview-label {
  font-weight: 600;
  color: #333;
}

.preview-value {
  color: #666;
}

/* 下载模态框样式 */
.download-modal {
  width: 600px;
  max-width: 90%;
}

.logo-upload-area {
  border: 2px dashed #d9d9d9;
  border-radius: 6px;
  padding: 20px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  background-color: #fafafa;
  min-height: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.logo-upload-area:hover,
.logo-upload-area.drag-over {
  border-color: #1890ff;
  background-color: #f0f8ff;
}

.logo-upload-placeholder {
  color: #999;
}

.logo-upload-placeholder svg {
  margin-bottom: 8px;
}

.logo-upload-placeholder p {
  margin: 4px 0;
  font-size: 14px;
}

.logo-hint {
  font-size: 12px;
  color: #999;
  margin-top: 8px;
}

.logo-preview {
  position: relative;
  display: inline-block;
}

.logo-preview img {
  max-width: 100px;
  max-height: 100px;
  border-radius: 4px;
  border: 1px solid #e8e8e8;
}

.remove-logo-btn {
  position: absolute;
  top: -8px;
  right: -8px;
  background: #ff4d4f;
  color: white;
  border: none;
  border-radius: 50%;
  width: 20px;
  height: 20px;
  cursor: pointer;
  font-size: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.paper-size-options {
  display: flex;
  gap: 20px;
  margin-top: 10px;
}

.size-option {
  display: flex;
  align-items: center;
  cursor: pointer;
  padding: 10px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  transition: all 0.3s ease;
}

.size-option:hover {
  border-color: #1890ff;
  background-color: #f0f8ff;
}

.size-option input[type="radio"] {
  margin-right: 8px;
}

.size-label {
  display: flex;
  flex-direction: column;
}

.size-name {
  font-weight: 600;
  color: #333;
  font-size: 14px;
}

.size-desc {
  font-size: 12px;
  color: #666;
  margin-top: 2px;
}

.preview-info {
  margin-top: 20px;
  padding: 15px;
  background-color: #f8f9fa;
  border-radius: 6px;
  border: 1px solid #e9ecef;
}

.preview-info h4 {
  margin: 0 0 12px 0;
  color: #333;
  font-size: 14px;
  font-weight: 600;
}

.preview-content {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.preview-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 4px 0;
}

.preview-label {
  font-weight: 500;
  color: #666;
  font-size: 13px;
}

.preview-value {
  color: #333;
  font-size: 13px;
  font-weight: 500;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .download-modal {
    width: 95%;
    margin: 20px;
  }

  .paper-size-options {
    flex-direction: column;
    gap: 10px;
  }

  .size-option {
    width: 100%;
  }
}

.paper-size-simple {
  display: flex;
  gap: 20px;
  margin-top: 10px;
}

.size-option-simple {
  display: flex;
  align-items: center;
  cursor: pointer;
  font-size: 14px;
  color: #333;
}

.size-option-simple input[type="radio"] {
  margin-right: 8px;
}

.size-option-simple:hover {
  color: #1890ff;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .download-modal {
    width: 95%;
    margin: 20px;
  }

  .paper-size-simple {
    flex-direction: column;
    gap: 10px;
  }
}

.question-selector {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.question-type-filter {
  flex: 1;
}

.filter-buttons {
  display: flex;
  gap: 10px;
}

.filter-btn {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.filter-btn.active {
  background-color: #c70019;
  color: white;
}

.questions-container {
  margin-top: 10px;
}

.questions-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.questions-actions {
  display: flex;
  gap: 10px;
}

.score-input {
  width: 80px;
  text-align: center;
}

.question-item {
  padding: 10px;
  border: 1px solid #e8e8e8;
  border-radius: 4px;
  margin-bottom: 5px;
  cursor: pointer;
}

.question-item.selected {
  background-color: #f0f0f0;
}

.question-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.question-type {
  font-weight: 600;
  color: #333;
}

.question-id {
  font-size: 12px;
  color: #666;
}

.question-content {
  margin-top: 5px;
  color: #333;
}

.question-answer {
  margin-top: 10px;
  color: #666;
}

.question-selector-modal {
  width: 600px;
  max-width: 90%;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .download-modal {
    width: 95%;
    margin: 20px;
  }

  .paper-size-simple {
    flex-direction: column;
    gap: 10px;
  }
}

/* 手动组卷全页面模式样式 */
.manual-paper-page {
  padding: 20px;
  background: #f5f5f5;
  min-height: 100vh;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 20px;
}

.header-left .page-title {
  margin: 0;
  color: #333;
  font-size: 24px;
  font-weight: 600;
}

.btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  border: 1px solid #dcdfe6;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s;
  font-size: 14px;
}

.btn-secondary {
  background: #f5f5f5;
  color: #333;
  border-color: #dcdfe6;
}

.btn-secondary:hover:not(:disabled) {
  background: #ebebeb;
  color: #333;
}

.header-right {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.paper-info {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
}

.info-label {
  color: #666;
  font-weight: 500;
}

.info-value {
  color: #333;
  font-weight: 600;
}

.question-type-summary {
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  margin-bottom: 30px;
}

.question-type-summary h4 {
  margin: 0 0 20px 0;
  color: #333;
  font-size: 18px;
  font-weight: 600;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 15px;
  margin-bottom: 20px;
}

.summary-item {
  background: #f8f9fa;
  padding: 15px;
  border-radius: 6px;
  border: 1px solid #e9ecef;
  text-align: center;
}

.summary-type {
  font-weight: 600;
  color: #333;
  margin-bottom: 8px;
}

.summary-count {
  color: #666;
  font-size: 14px;
  margin-bottom: 4px;
}

.summary-score {
  color: #c70019;
  font-weight: 600;
  font-size: 16px;
}

.summary-total {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 20px;
  padding: 15px;
  background: #c70019;
  color: white;
  border-radius: 6px;
  font-weight: 600;
}

.question-selection-area {
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  margin-bottom: 30px;
}

.selection-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.selection-header h3 {
  margin: 0;
  color: #333;
  font-size: 20px;
  font-weight: 600;
}

.selection-actions {
  display: flex;
  gap: 10px;
}

.btn-select-all,
.btn-clear {
  padding: 8px 16px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  background: white;
  color: #666;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-select-all:hover,
.btn-clear:hover {
  border-color: #c70019;
  color: #c70019;
}

.question-type-filter {
  margin-bottom: 20px;
}

.question-type-filter h4 {
  margin: 0 0 15px 0;
  color: #333;
  font-size: 16px;
  font-weight: 600;
}

.filter-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.filter-btn {
  padding: 8px 16px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  background: white;
  color: #666;
  cursor: pointer;
  transition: all 0.3s;
  font-size: 14px;
}

.filter-btn.active {
  background: #c70019;
  color: white;
  border-color: #c70019;
}

.filter-btn:hover {
  border-color: #c70019;
  color: #c70019;
}

.questions-container {
  margin-top: 20px;
}

.questions-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.questions-header h4 {
  margin: 0;
  color: #333;
  font-size: 16px;
  font-weight: 600;
}

.question-count {
  color: #666;
  font-size: 14px;
}

.questions-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.question-item {
  border: 1px solid #e9ecef;
  border-radius: 6px;
  padding: 15px;
  transition: all 0.3s;
  background: white;
}

.question-item.selected {
  border-color: #c70019;
  background: #fff5f5;
}

.question-info {
  flex: 1;
}

.question-header {
  display: flex;
  align-items: center;
  gap: 15px;
  margin-bottom: 10px;
}

.question-checkbox {
  margin: 0;
}

.question-id {
  color: #666;
  font-size: 12px;
  background: #f0f0f0;
  padding: 2px 6px;
  border-radius: 3px;
}

.question-type {
  color: #c70019;
  font-size: 12px;
  font-weight: 600;
  background: #fff0f0;
  padding: 2px 6px;
  border-radius: 3px;
}

.question-content {
  margin-bottom: 10px;
  line-height: 1.6;
  color: #333;
}

.question-answer {
  background: #f8f9fa;
  padding: 10px;
  border-radius: 4px;
  border-left: 3px solid #c70019;
}

.answer-label {
  font-weight: 600;
  color: #666;
  margin-right: 8px;
}

.answer-content {
  color: #333;
  font-weight: 500;
}

.question-score {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 10px;
}

.question-score label {
  font-weight: 600;
  color: #666;
  font-size: 14px;
}

.score-input {
  width: 80px;
  padding: 6px 10px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  font-size: 14px;
}

.page-actions {
  display: flex;
  justify-content: center;
  gap: 20px;
  padding: 20px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.page-actions .btn {
  padding: 12px 24px;
  font-size: 16px;
  font-weight: 600;
}

.question-selector {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.paper-basic-info {
  margin-top: 10px;
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  margin-bottom: 30px;
}

.paper-basic-info h4 {
  margin: 0 0 20px 0;
  color: #333;
  font-size: 18px;
  font-weight: 600;
}

.info-form {
  display: flex;
  gap: 10px;
}

.info-form .form-row {
  flex: 1;
}

.info-form .form-row:last-child {
  flex: 2;
}

.form-row {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.form-row label {
  font-weight: 600;
  color: #333;
  font-size: 14px;
}

.form-control {
  position: relative;
}

.form-select {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  font-size: 14px;
  background: white;
  transition: all 0.3s;
}

.form-select:focus {
  outline: none;
  border-color: #c70019;
  box-shadow: 0 0 0 2px rgba(199, 0, 25, 0.1);
}

.form-textarea {
  width: 100%;
  padding: 8px 10px;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  font-size: 14px;
  background: white;
  resize: vertical;
  min-height: 60px;
  transition: all 0.3s;
}

.form-textarea:focus {
  outline: none;
  border-color: #c70019;
  box-shadow: 0 0 0 2px rgba(199, 0, 25, 0.1);
}

.question-bank-selection {
  margin-bottom: 20px;
}

.bank-selection-form {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.bank-selection-form .form-row {
  flex: 1;
}

.bank-selection-form .form-row:last-child {
  flex: 2;
}

.form-row {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.form-row label {
  font-weight: 600;
  color: #333;
  font-size: 14px;
}

.form-control {
  position: relative;
}

.form-select {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  font-size: 14px;
  background: white;
  transition: all 0.3s;
}

.form-select:focus {
  outline: none;
  border-color: #c70019;
  box-shadow: 0 0 0 2px rgba(199, 0, 25, 0.1);
}

.form-textarea {
  width: 100%;
  padding: 8px 10px;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  font-size: 14px;
  background: white;
  resize: vertical;
  min-height: 60px;
  transition: all 0.3s;
}

.form-textarea:focus {
  outline: none;
  border-color: #c70019;
  box-shadow: 0 0 0 2px rgba(199, 0, 25, 0.1);
}

.btn-primary {
  background-color: #c70019;
  color: white;
}

.btn-primary:hover {
  background-color: #66b1ff;
}

.btn-secondary {
  background-color: #f5f5f5;
  color: #666;
}

.btn-secondary:hover {
  background-color: #e6e6e6;
  color: #333;
}

.btn-disabled {
  background-color: #abada9;
  cursor: not-allowed;
}

.btn-disabled:hover {
  background-color: #999;
  color: #666;
}

.btn-loading {
  background-color: #c70019;
  color: white;
  cursor: wait;
}

.btn-loading:hover {
  background-color: #66b1ff;
}

.btn-loading:disabled {
  background-color: #abada9;
  cursor: not-allowed;
}

.btn-loading:disabled:hover {
  background-color: #999;
  color: #666;
}

.btn-loading:active {
  background-color: #66b1ff;
}

.btn-loading:active:hover {
  background-color: #3399ff;
}

.btn-loading:focus {
  outline: none;
  box-shadow: 0 0 0 2px rgba(199, 0, 25, 0.2);
}

.btn-loading:focus:hover {
  background-color: #66b1ff;
}

.btn-loading:focus:disabled {
  background-color: #abada9;
  cursor: not-allowed;
}

.btn-loading:focus:disabled:hover {
  background-color: #999;
  color: #666;
}

.btn-loading:focus:active {
  background-color: #66b1ff;
}

.btn-loading:focus:active:hover {
  background-color: #3399ff;
}

.btn-loading:focus:active:disabled {
  background-color: #abada9;
  cursor: not-allowed;
}

.btn-loading:focus:active:disabled:hover {
  background-color: #999;
  color: #666;
}

.btn-loading:focus:active:focus {
  outline: none;
  box-shadow: 0 0 0 2px rgba(199, 0, 25, 0.2);
}

.btn-loading:focus:active:focus:hover {
  background-color: #66b1ff;
}

.btn-loading:focus:active:focus:disabled {
  background-color: #abada9;
  cursor: not-allowed;
}

.btn-loading:focus:active:focus:disabled:hover {
  background-color: #999;
  color: #666;
}

.btn-loading:focus:active:active {
  background-color: #66b1ff;
}

.btn-loading:focus:active:active:hover {
  background-color: #3399ff;
}

.btn-loading:focus:active:active:disabled {
  background-color: #abada9;
  cursor: not-allowed;
}

.btn-loading:focus:active:active:disabled:hover {
  background-color: #999;
  color: #666;
}

.btn-loading:focus:active:active:focus {
  outline: none;
  box-shadow: 0 0 0 2px rgba(199, 0, 25, 0.2);
}

.btn-loading:focus:active:active:focus:hover {
  background-color: #66b1ff;
}

.btn-loading:focus:active:active:focus:disabled {
  background-color: #abada9;
  cursor: not-allowed;
}

.btn-loading:focus:active:active:focus:disabled:hover {
  background-color: #999;
  color: #666;
}

.btn-loading:focus:active:active:active {
  background-color: #66b1ff;
}

.btn-loading:focus:active:active:active:hover {
  background-color: #3399ff;
}

.btn-loading:focus:active:active:active:disabled {
  background-color: #abada9;
  cursor: not-allowed;
}

.btn-loading:focus:active:active:active:disabled:hover {
  background-color: #999;
  color: #666;
}

.btn-loading:focus:active:active:active:focus {
  outline: none;
  box-shadow: 0 0 0 2px rgba(199, 0, 25, 0.2);
}

.btn-loading:focus:active:active:active:focus:hover {
  background-color: #66b1ff;
}

.btn-loading:focus:active:active:active:focus:disabled {
  background-color: #abada9;
  cursor: not-allowed;
}

.btn-loading:focus:active:active:active:focus:disabled:hover {
  background-color: #999;
  color: #666;
}

.btn-loading:focus:active:active:active:active {
  background-color: #66b1ff;
}

.btn-loading:focus:active:active:active:active:hover {
  background-color: #3399ff;
}

.btn-loading:focus:active:active:active:active:disabled {
  background-color: #abada9;
  cursor: not-allowed;
}

.btn-loading:focus:active:active:active:active:disabled:hover {
  background-color: #999;
  color: #666;
}

.btn-loading:focus:active:active:active:active:focus {
  outline: none;
  box-shadow: 0 0 0 2px rgba(199, 0, 25, 0.2);
}

.btn-loading:focus:active:active:active:active:focus:hover {
  background-color: #66b1ff;
}

.btn-loading:focus:active:active:active:active:focus:disabled {
  background-color: #abada9;
  cursor: not-allowed;
}

.btn-loading:focus:active:active:active:active:focus:disabled:hover {
  background-color: #999;
  color: #666;
}

.btn-loading:focus:active:active:active:active:active {
  background-color: #66b1ff;
}

.btn-loading:focus:active:active:active:active:active:hover {
  background-color: #3399ff;
}

.btn-loading:focus:active:active:active:active:active:disabled {
  background-color: #abada9;
  cursor: not-allowed;
}

.btn-loading:focus:active:active:active:active:active:disabled:hover {
  background-color: #999;
  color: #666;
}

.btn-loading:focus:active:active:active:active:active:focus {
  outline: none;
  box-shadow: 0 0 0 2px rgba(199, 0, 25, 0.2);
}

.btn-loading:focus:active:active:active:active:active:focus:hover {
  background-color: #66b1ff;
}

.btn-loading:focus:active:active:active:active:active:focus:disabled {
  background-color: #abada9;
  cursor: not-allowed;
}

.btn-loading:focus:active:active:active:active:active:focus:disabled:hover {
  background-color: #999;
  color: #666;
}

.btn-loading:focus:active:active:active:active:active:active {
  background-color: #66b1ff;
}

.btn-loading:focus:active:active:active:active:active:active:hover {
  background-color: #3399ff;
}

.btn-loading:focus:active:active:active:active:active:active:disabled {
  background-color: #abada9;
  cursor: not-allowed;
}

.btn-loading:focus:active:active:active:active:active:active:disabled:hover {
  background-color: #999;
  color: #666;
}

.btn-loading:focus:active:active:active:active:active:active:focus {
  outline: none;
  box-shadow: 0 0 0 2px rgba(199, 0, 25, 0.2);
}

.btn-loading:focus:active:active:active:active:active:active:focus:hover {
  background-color: #66b1ff;
}

.btn-loading:focus:active:active:active:active:active:active:focus:disabled {
  background-color: #abada9;
  cursor: not-allowed;
}

.btn-loading:focus:active:active:active:active:active:active:focus:disabled:hover {
  background-color: #999;
  color: #666;
}

.btn-loading:focus:active:active:active:active:active:active:active {
  background-color: #66b1ff;
}

.btn-loading:focus:active:active:active:active:active:active:active:hover {
  background-color: #3399ff;
}

.btn-loading:focus:active:active:active:active:active:active:active:disabled {
  background-color: #abada9;
  cursor: not-allowed;
}

.btn-loading:focus:active:active:active:active:active:active:active:disabled:hover {
  background-color: #999;
  color: #666;
}

.btn-loading:focus:active:active:active:active:active:active:active:focus {
  outline: none;
  box-shadow: 0 0 0 2px rgba(199, 0, 25, 0.2);
}

.btn-loading:focus:active:active:active:active:active:active:active:focus:hover {
  background-color: #66b1ff;
}

.btn-loading:focus:active:active:active:active:active:active:active:focus:disabled {
  background-color: #abada9;
  cursor: not-allowed;
}

.btn-loading:focus:active:active:active:active:active:active:active:focus:disabled:hover {
  background-color: #999;
  color: #666;
}

.btn-loading:focus:active:active:active:active:active:active:active:active {
  background-color: #66b1ff;
}

.btn-loading:focus:active:active:active:active:active:active:active:hover {
  background-color: #3399ff;
}

.btn-loading:focus:active:active:active:active:active:active:active:disabled {
  background-color: #abada9;
  cursor: not-allowed;
}

.btn-loading:focus:active:active:active:active:active:active:active:disabled:hover {
  background-color: #999;
  color: #666;
}

.btn-loading:focus:active:active:active:active:active:active:active:focus {
  outline: none;
  box-shadow: 0 0 0 2px rgba(199, 0, 25, 0.2);
}

.btn-loading:focus:active:active:active:active:active:active:active:focus:hover {
  background-color: #66b1ff;
}

.btn-loading:focus:active:active:active:active:active:active:active:focus:disabled {
  background-color: #abada9;
  cursor: not-allowed;
}

.btn-loading:focus:active:active:active:active:active:active:active:focus:disabled:hover {
  background-color: #999;
  color: #666;
}

.btn-loading:focus:active:active:active:active:active:active:active:active {
  background-color: #66b1ff;
}

.btn-loading:focus:active:active:active:active:active:active:active:hover {
  background-color: #3399ff;
}

.btn-loading:focus:active:active:active:active:active:active:active:disabled {
  background-color: #abada9;
  cursor: not-allowed;
}

.btn-loading:focus:active:active:active:active:active:active:active:disabled:hover {
  background-color: #999;
  color: #666;
}

.btn-loading:focus:active:active:active:active:active:active:active:focus {
  outline: none;
  box-shadow: 0 0 0 2px rgba(199, 0, 25, 0.2);
}

.btn-loading:focus:active:active:active:active:active:active:active:focus:hover {
  background-color: #66b1ff;
}

.btn-loading:focus:active:active:active:active:active:active:active:focus:disabled {
  background-color: #abada9;
  cursor: not-allowed;
}

.btn-loading:focus:active:active:active:active:active:active:active:focus:disabled:hover {
  background-color: #999;
  color: #666;
}

.btn-loading:focus:active:active:active:active:active:active:active:active {
  background-color: #66b1ff;
}

.btn-loading:focus:active:active:active:active:active:active:active:hover {
  background-color: #3399ff;
}

.btn-loading:focus:active:active:active:active:active:active:active:disabled {
  background-color: #abada9;
  cursor: not-allowed;
}

.btn-loading:focus:active:active:active:active:active:active:active:disabled:hover {
  background-color: #999;
  color: #666;
}

.btn-loading:focus:active:active:active:active:active:active:active:focus {
  outline: none;
  box-shadow: 0 0 0 2px rgba(199, 0, 25, 0.2);
}

.btn-loading:focus:active:active:active:active:active:active:active:focus:hover {
  background-color: #66b1ff;
}

.btn-loading:focus:active:active:active:active:active:active:active:focus:disabled {
  background-color: #abada9;
  cursor: not-allowed;
}

.btn-loading:focus:active:active:active:active:active:active:active:focus:disabled:hover {
  background-color: #999;
  color: #666;
}

.btn-loading:focus:active:active:active:active:active:active:active:active {
  background-color: #66b1ff;
}

.btn-loading:focus:active:active:active:active:active:active:active:hover {
  background-color: #3399ff;
}

.btn-loading:focus:active:active:active:active:active:active:active:disabled {
  background-color: #abada9;
  cursor: not-allowed;
}

.btn-loading:focus:active:active:active:active:active:active:active:disabled:hover {
  background-color: #999;
  color: #666;
}

.btn-loading:focus:active:active:active:active:active:active:active:focus {
  outline: none;
  box-shadow: 0 0 0 2px rgba(199, 0, 25, 0.2);
}

.btn-loading:focus:active:active:active:active:active:active:active:focus:hover {
  background-color: #66b1ff;
}

.btn-loading:focus:active:active:active:active:active:active:active:focus:disabled {
  background-color: #abada9;
  cursor: not-allowed;
}

.btn-loading:focus:active:active:active:active:active:active:active:focus:disabled:hover {
  background-color: #999;
  color: #666;
}

.btn-loading:focus:active:active:active:active:active:active:active:active {
  background-color: #66b1ff;
}

.btn-loading:focus:active:active:active:active:active:active:active:hover {
  background-color: #3399ff;
}

.btn-loading:focus:active:active:active:active:active:active:active:disabled {
  background-color: #abada9;
  cursor: not-allowed;
}

.btn-loading:focus:active:active:active:active:active:active:active:disabled:hover {
  background-color: #999;
  color: #666;
}

.btn-loading:focus:active:active:active:active:active:active:active:focus {
  outline: none;
  box-shadow: 0 0 0 2px rgba(199, 0, 25, 0.2);
}

.btn-loading:focus:active:active:active:active:active:active:active:focus:hover {
  background-color: #66b1ff;
}

.btn-loading:focus:active:active:active:active:active:active:active:focus:disabled {
  background-color: #abada9;
  cursor: not-allowed;
}

.btn-loading:focus:active:active:active:active:active:active:active:focus:disabled:hover {
  background-color: #999;
  color: #666;
}

.btn-loading:focus:active:active:active:active:active:active:active:active {
  background-color: #66b1ff;
}

.btn-loading:focus:active:active:active:active:active:active:active:hover {
  background-color: #3399ff;
}

.btn-loading:focus:active:active:active:active:active:active:active:disabled {
  background-color: #abada9;
  cursor: not-allowed;
}

.btn-loading:focus:active:active:active:active:active:active:active:disabled:hover {
  background-color: #999;
  color: #666;
}

.btn-loading:focus:active:active:active:active:active:active:active:focus {
  outline: none;
  box-shadow: 0 0 0 2px rgba(199, 0, 25, 0.2);
}

.btn-loading:focus:active:active:active:active:active:active:active:focus:hover {
  background-color: #66b1ff;
}

.btn-loading:focus:active:active:active:active:active:active:active:focus:disabled {
  background-color: #abada9;
  cursor: not-allowed;
}

.btn-loading:focus:active:active:active:active:active:active:active:focus:disabled:hover {
  background-color: #999;
  color: #666;
}

.btn-loading:focus:active:active:active:active:active:active:active:active {
  background-color: #66b1ff;
}

.btn-loading:focus:active:active:active:active:active:active:active:hover {
  background-color: #3399ff;
}

.btn-loading:focus:active:active:active:active:active:active:active:disabled {
  background-color: #abada9;
  cursor: not-allowed;
}

.btn-loading:focus:active:active:active:active:active:active:active:disabled:hover {
  background-color: #999;
  color: #666;
}

.btn-loading:focus:active:active:active:active:active:active:active:focus {
  outline: none;
  box-shadow: 0 0 0 2px rgba(199, 0, 25, 0.2);
}

.btn-loading:focus:active:active:active:active:active:active:active:focus:hover {
  background-color: #66b1ff;
}

.btn-loading:focus:active:active:active:active:active:active:active:focus:disabled {
  background-color: #abada9;
  cursor: not-allowed;
}

.btn-loading:focus:active:active:active:active:active:active:active:focus:disabled:hover {
  background-color: #999;
  color: #666;
}

.btn-loading:focus:active:active:active:active:active:active:active:active {
  background-color: #66b1ff;
}

.btn-loading:focus:active:active:active:active:active:active:active:hover {
  background-color: #3399ff;
}

.btn-loading:focus:active:active:active:active:active:active:active:disabled {
  background-color: #abada9;
  cursor: not-allowed;
}

.btn-loading:focus:active:active:active:active:active:active:active:disabled:hover {
  background-color: #999;
  color: #666;
}

.btn-loading:focus:active:active:active:active:active:active:active:focus {
  outline: none;
  box-shadow: 0 0 0 2px rgba(199, 0, 25, 0.2);
}

.btn-loading:focus:active:active:active:active:active:active:active:focus:hover {
  background-color: #66b1ff;
}

.btn-loading:focus:active:active:active:active:active:active:active:focus:disabled {
  background-color: #abada9;
  cursor: not-allowed;
}

.btn-loading:focus:active:active:active:active:active:active:active:focus:disabled:hover {
  background-color: #999;
  color: #666;
}

.btn-loading:focus:active:active:active:active:active:active:active:active {
  background-color: #66b1ff;
}

.btn-loading:focus:active:active:active:active:active:active:active:hover {
  background-color: #3399ff;
}

.btn-loading:focus:active:active:active:active:active:active:active:disabled {
  background-color: #abada9;
  cursor: not-allowed;
}

.btn-loading:focus:active:active:active:active:active:active:active:disabled:hover {
  background-color: #999;
  color: #666;
}

.btn-loading:focus:active:active:active:active:active:active:active:focus {
  outline: none;
  box-shadow: 0 0 0 2px rgba(199, 0, 25, 0.2);
}

.btn-loading:focus:active:active:active:active:active:active:active:focus:hover {
  background-color: #66b1ff;
}

.btn-loading:focus:active:active:active:active:active:active:active:focus:disabled {
  background-color: #abada9;
  cursor: not-allowed;
}

.btn-loading:focus:active:active:active:active:active:active:active:focus:disabled:hover {
  background-color: #999;
  color: #666;
}

.btn-loading:focus:active:active:active:active:active:active:active:active {
  background-color: #66b1ff;
}

.btn-loading:focus:active:active:active:active:active:active:active:hover {
  background-color: #3399ff;
}

.btn-loading:focus:active:active:active:active:active:active:active:disabled {
  background-color: #abada9;
  cursor: not-allowed;
}

.btn-loading:focus:active:active:active:active:active:active:active:disabled:hover {
  background-color: #999;
  color: #666;
}

.btn-loading:focus:active:active:active:active:active:active:active:focus {
  outline: none;
  box-shadow: 0 0 0 2px rgba(199, 0, 25, 0.2);
}

.btn-loading:focus:active:active:active:active:active:active:active:focus:hover {
  background-color: #66b1ff;
}

.btn-loading:focus:active:active:active:active:active:active:active:focus:disabled {
  background-color: #abada9;
  cursor: not-allowed;
}

.btn-loading:focus:active:active:active:active:active:active:active:focus:disabled:hover {
  background-color: #999;
  color: #666;
}

.btn-loading:focus:active:active:active:active:active:active:active:active {
  background-color: #66b1ff;
}

.btn-loading:focus:active:active:active:active:active:active:active:hover {
  background-color: #3399ff;
}

.btn-loading:focus:active:active:active:active:active:active:active:disabled {
  background-color: #abada9;
  cursor: not-allowed;
}

.btn-loading:focus:active:active:active:active:active:active:active:disabled:hover {
  background-color: #999;
  color: #666;
}

.btn-loading:focus:active:active:active:active:active:active:active:focus {
  outline: none;
  box-shadow: 0 0 0 2px rgba(199, 0, 25, 0.2);
}

.btn-loading:focus:active:active:active:active:active:active:active:focus:hover {
  background-color: #66b1ff;
}

.btn-loading:focus:active:active:active:active:active:active:active:focus:disabled {
  background-color: #abada9;
  cursor: not-allowed;
}

.btn-loading:focus:active:active:active:active:active:active:active:focus:disabled:hover {
  background-color: #999;
  color: #666;
}

.btn-loading:focus:active:active:active:active:active:active:active:active {
  background-color: #66b1ff;
}

.btn-loading:focus:active:active:active:active:active:active:active:hover {
  background-color: #3399ff;
}

.btn-loading:focus:active:active:active:active:active:active:active:disabled {
  background-color: #abada9;
  cursor: not-allowed;
}

.btn-loading:focus:active:active:active:active:active:active:active:disabled:hover {
  background-color: #999;
  color: #666;
}

.btn-loading:focus:active:active:active:active:active:active:active:focus {
  outline: none;
  box-shadow: 0 0 0 2px rgba(199, 0, 25, 0.2);
}

.btn-loading:focus:active:active:active:active:active:active:active:focus:hover {
  background-color: #66b1ff;
}

.btn-loading:focus:active:active:active:active:active:active:active:focus:disabled {
  background-color: #abada9;
  cursor: not-allowed;
}

.btn-loading:focus:active:active:active:active:active:active:active:focus:disabled:hover {
  background-color: #999;
  color: #666;
}

.btn-loading:focus:active:active:active:active:active:active:active:active {
  background-color: #66b1ff;
}

.btn-loading:focus:active:active:active:active:active:active:active:hover {
  background-color: #3399ff;
}

.btn-loading:focus:active:active:active:active:active:active:active:disabled {
  background-color: #abada9;
  cursor: not-allowed;
}

.btn-loading:focus:active:active:active:active:active:active:active:disabled:hover {
  background-color: #999;
  color: #666;
}

.btn-loading:focus:active:active:active:active:active:active:active:focus {
  outline: none;
  box-shadow: 0 0 0 2px rgba(199, 0, 25, 0.2);
}

.btn-loading:focus:active:active:active:active:active:active:active:focus:hover {
  background-color: #66b1ff;
}

.btn-loading:focus:active:active:active:active:active:active:active:focus:disabled {
  background-color: #abada9;
  cursor: not-allowed;
}

.btn-loading:focus:active:active:active:active:active:active:active:focus:disabled:hover {
  background-color: #999;
  color: #666;
}

.btn-loading:focus:active:active:active:active:active:active:active:active {
  background-color: #66b1ff;
}

.btn-loading:focus:active:active:active:active:active:active:active:hover {
  background-color: #3399ff;
}

.btn-loading:focus:active:active:active:active:active:active:active:disabled {
  background-color: #abada9;
  cursor: not-allowed;
}

.btn-loading:focus:active:active:active:active:active:active:active:disabled:hover {
  background-color: #999;
  color: #666;
}

.btn-loading:focus:active:active:active:active:active:active:active:focus {
  outline: none;
  box-shadow: 0 0 0 2px rgba(199, 0, 25, 0.2);
}

.btn-loading:focus:active:active:active:active:active:active:active:focus:hover {
  background-color: #66b1ff;
}

.btn-loading:focus:active:active:active:active:active:active:active:focus:disabled {
  background-color: #abada9;
  cursor: not-allowed;
}

.btn-loading:focus:active:active:active:active:active:active:active:focus:disabled:hover {
  background-color: #999;
  color: #666;
}

.btn-loading:focus:active:active:active:active:active:active:active:active {
  background-color: #66b1ff;
}

.btn-loading:focus:active:active:active:active:active:active:active:hover {
  background-color: #3399ff;
}

.btn-loading:focus:active:active:active:active:active:active:active:disabled {
  background-color: #abada9;
  cursor: not-allowed;
}

.btn-loading:focus:active:active:active:active:active:active:active:disabled:hover {
  background-color: #999;
  color: #666;
}

.btn-loading:focus:active:active:active:active:active:active:active:focus {
  outline: none;
  box-shadow: 0 0 0 2px rgba(199, 0, 25, 0.2);
}

.btn-loading:focus:active:active:active:active:active:active:active:focus:hover {
  background-color: #66b1ff;
}

.btn-loading:focus:active:active:active:active:active:active:active:focus:disabled {
  background-color: #abada9;
  cursor: not-allowed;
}

.btn-loading:focus:active:active:active:active:active:active:active:focus:disabled:hover {
  background-color: #999;
  color: #666;
}

.btn-loading:focus:active:active:active:active:active:active:active:active {
  background-color: #66b1ff;
}

.btn-loading:focus:active:active:active:active:active:active:active:hover {
  background-color: #3399ff;
}

.btn-loading:focus:active:active:active:active:active:active:active:disabled {
  background-color: #abada9;
  cursor: not-allowed;
}

.btn-loading:focus:active:active:active:active:active:active:active:disabled:hover {
  background-color: #999;
  color: #666;
}

.btn-loading:focus:active:active:active:active:active:active:active:focus {
  outline: none;
  box-shadow: 0 0 0 2px rgba(199, 0, 25, 0.2);
}

.btn-loading:focus:active:active:active:active:active:active:active:focus:hover {
  background-color: #66b1ff;
}

.btn-loading:focus:active:active:active:active:active:active:active:focus:disabled {
  background-color: #abada9;
  cursor: not-allowed;
}

.btn-loading:focus:active:active:active:active:active:active:active:focus:disabled:hover {
  background-color: #999;
  color: #666;
}

.btn-loading:focus:active:active:active:active:active:active:active:active {
  background-color: #66b1ff;
}

.btn-loading:focus:active:active:active:active:active:active:active:hover {
  background-color: #3399ff;
}

.btn-loading:focus:active:active:active:active:active:active:active:disabled {
  background-color: #abada9;
  cursor: not-allowed;
}

.btn-loading:focus:active:active:active:active:active:active:active:disabled:hover {
  background-color: #999;
  color: #666;
}

.btn-loading:focus:active:active:active:active:active:active:active:focus {
  outline: none;
  box-shadow: 0 0 0 2px rgba(199, 0, 25, 0.2);
}

.btn-loading:focus:active:active:active:active:active:active:active:focus:hover {
  background-color: #66b1ff;
}

.btn-loading:focus:active:active:active:active:active:active:active:focus:disabled {
  background-color: #abada9;
  cursor: not-allowed;
}

.btn-loading:focus:active:active:active:active:active:active:active:focus:disabled:hover {
  background-color: #999;
  color: #666;
}

.btn-loading:focus:active:active:active:active:active:active:active:active {
  background-color: #66b1ff;
}

.btn-loading:focus:active:active:active:active:active:active:active:hover {
  background-color: #3399ff;
}

.btn-loading:focus:active:active:active:active:active:active:active:disabled {
  background-color: #abada9;
  cursor: not-allowed;
}

.btn-loading:focus:active:active:active:active:active:active:active:disabled:hover {
  background-color: #999;
  color: #666;
}

.btn-loading:focus:active:active:active:active:active:active:active:focus {
  outline: none;
  box-shadow: 0 0 0 2px rgba(199, 0, 25, 0.2);
}

.btn-loading:focus:active:active:active:active:active:active:active:focus:hover {
  background-color: #66b1ff;
}

.btn-loading:focus:active:active:active:active:active:active:active:focus:disabled {
  background-color: #abada9;
  cursor: not-allowed;
}

.btn-loading:focus:active:active:active:active:active:active:active:focus:disabled:hover {
  background-color: #999;
  color: #666;
}

.btn-loading:focus:active:active:active:active:active:active:active:active {
  background-color: #66b1ff;
}

.btn-loading:focus:active:active:active:active:active:active:active:hover {
  background-color: #3399ff;
}

.btn-loading:focus:active:active:active:active:active:active:active:disabled {
  background-color: #abada9;
  cursor: not-allowed;
}

.btn-loading:focus:active:active:active:active:active:active:active:disabled:hover {
  background-color: #999;
  color: #666;
}

.btn-loading:focus:active:active:active:active:active:active:active:focus {
  outline: none;
  box-shadow: 0 0 0 2px rgba(199, 0, 25, 0.2);
}

.btn-loading:focus:active:active:active:active:active:active:active:focus:hover {
  background-color: #66b1ff;
}

.btn-loading:focus:active:active:active:active:active:active:active:focus:disabled {
  background-color: #abada9;
  cursor: not-allowed;
}

.btn-loading:focus:active:active:active:active:active:active:active:focus:disabled:hover {
  background-color: #999;
  color: #666;
}

.btn-loading:focus:active:active:active:active:active:active:active:active {
  background-color: #66b1ff;
}

.btn-loading:focus:active:active:active:active:active:active:active:hover {
  background-color: #3399ff;
}

.btn-loading:focus:active:active:active:active:active:active:active:disabled {
  background-color: #abada9;
  cursor: not-allowed;
}

.btn-loading:focus:active:active:active:active:active:active:active:disabled:hover {
  background-color: #999;
  color: #666;
}

.btn-loading:focus:active:active:active:active:active:active:active:focus {
  outline: none;
  box-shadow: 0 0 0 2px rgba(199, 0, 25, 0.2);
}

.btn-loading:focus:active:active:active:active:active:active:active:focus:hover {
  background-color: #66b1ff;
}

.btn-loading:focus:active:active:active:active:active:active:active:focus:disabled {
  background-color: #abada9;
  cursor: not-allowed;
}

.btn-loading:focus:active:active:active:active:active:active:active:focus:disabled:hover {
  background-color: #999;
  color: #666;
}

.btn-loading:focus:active:active:active:active:active:active:active:active {
  background-color: #66b1ff;
}

.btn-loading:focus:active:active:active:active:active:active:active:hover {
  background-color: #3399ff;
}

.btn-loading:focus:active:active:active:active:active:active:active:disabled {
  background-color: #abada9;
  cursor: not-allowed;
}

.btn-loading:focus:active:active:active:active:active:active:active:disabled:hover {
  background-color: #999;
  color: #666;
}

.btn-loading:focus:active:active:active:active:active:active:active:focus {
  outline: none;
  box-shadow: 0 0 0 2px rgba(199, 0, 25, 0.2);
}

.btn-loading:focus:active:active:active:active:active:active:active:focus:hover {
  background-color: #66b1ff;
}

.btn-loading:focus:active:active:active:active:active:active:active:focus:disabled {
  background-color: #abada9;
  cursor: not-allowed;
}

.btn-loading:focus:active:active:active:active:active:active:active:focus:disabled:hover {
  background-color: #999;
  color: #666;
}

.btn-loading:focus:active:active:active:active:active:active:active:active {
  background-color: #66b1ff;
}

.btn-loading:focus:active:active:active:active:active:active:active:hover {
  background-color: #3399ff;
}

.btn-loading:focus:active:active:active:active:active:active:active:disabled {
  background-color: #abada9;
  cursor: not-allowed;
}

.btn-loading:focus:active:active:active:active:active:active:active:disabled:hover {
  background-color: #999;
  color: #666;
}

.btn-loading:focus:active:active:active:active:active:active:active:focus {
  outline: none;
  box-shadow: 0 0 0 2px rgba(199, 0, 25, 0.2);
}

.btn-loading:focus:active:active:active:active:active:active:active:focus:hover {
  background-color: #66b1ff;
}

.btn-loading:focus:active:active:active:active:active:active:active:focus:disabled {
  background-color: #abada9;
  cursor: not-allowed;
}

.btn-loading:focus:active:active:active:active:active:active:active:focus:disabled:hover {
  background-color: #999;
  color: #666;
}

.btn-loading:focus:active:active:active:active:active:active:active:active {
  background-color: #66b1ff;
}

.btn-loading:focus:active:active:active:active:active:active:active:hover {
  background-color: #3399ff;
}

.btn-loading:focus:active:active:active:active:active:active:active:disabled {
  background-color: #abada9;
  cursor: not-allowed;
}

.btn-loading:focus:active:active:active:active:active:active:active:disabled:hover {
  background-color: #999;
  color: #666;
}

.btn-loading:focus:active:active:active:active:active:active:active:focus {
  outline: none;
  box-shadow: 0 0 0 2px rgba(199, 0, 25, 0.2);
}

.btn-loading:focus:active:active:active:active:active:active:active:focus:hover {
  background-color: #66b1ff;
}

.btn-loading:focus:active:active:active:active:active:active:active:focus:disabled {
  background-color: #abada9;
  cursor: not-allowed;
}

.btn-loading:focus:active:active:active:active:active:active:active:focus:disabled:hover {
  background-color: #999;
  color: #666;
}

.btn-loading:focus:active:active:active:active:active:active:active:active {
  background-color: #66b1ff;
}

.btn-loading:focus:active:active:active:active:active:active:active:hover {
  background-color: #3399ff;
}

.btn-loading:focus:active:active:active:active:active:active:active:disabled {
  background-color: #abada9;
  cursor: not-allowed;
}

.btn-loading:focus:active:active:active:active:active:active:active:disabled:hover {
  background-color: #999;
  color: #666;
}

.btn-loading:focus:active:active:active:active:active:active:active:focus {
  outline: none;
  box-shadow: 0 0 0 2px rgba(199, 0, 25, 0.2);
}

.btn-loading:focus:active:active:active:active:active:active:active:focus:hover {
  background-color: #66b1ff;
}

.btn-loading:focus:active:active:active:active:active:active:active:focus:disabled {
  background-color: #abada9;
  cursor: not-allowed;
}

.btn-loading:focus:active:active:active:active:active:active:active:focus:disabled:hover {
  background-color: #999;
  color: #666;
}

.btn-loading:focus:active:active:active:active:active:active:active:active {
  background-color: #66b1ff;
}

.btn-loading:focus:active:active:active:active:active:active:active:hover {
  background-color: #3399ff;
}

.btn-loading:focus:active:active:active:active:active:active:active:disabled {
  background-color: #abada9;
  cursor: not-allowed;
}

.btn-loading:focus:active:active:active:active:active:active:active:disabled:hover {
  background-color: #999;
  color: #666;
}

.btn-loading:focus:active:active:active:active:active:active:active:focus {
  outline: none;
  box-shadow: 0 0 0 2px rgba(199, 0, 25, 0.2);
}

.btn-loading:focus:active:active:active:active:active:active:active:focus:hover {
  background-color: #66b1ff;
}

.btn-loading:focus:active:active:active:active:active:active:active:focus:disabled {
  background-color: #abada9;
  cursor: not-allowed;
}

.btn-loading:focus:active:active:active:active:active:active:active:focus:disabled:hover {
  background-color: #999;
  color: #666;
}

.btn-loading:focus:active:active:active:active:active:active:active:active {
  background-color: #66b1ff;
}

.btn-loading:focus:active:active:active:active:active:active:active:hover {
  background-color: #3399ff;
}

.btn-loading:focus:active:active:active:active:active:active:active:disabled {
  background-color: #abada9;
  cursor: not-allowed;
}

.btn-loading:focus:active:active:active:active:active:active:active:disabled:hover {
  background-color: #999;
  color: #666;
}

.btn-loading:focus:active:active:active:active:active:active:active:focus {
  outline: none;
  box-shadow: 0 0 0 2px rgba(199, 0, 25, 0.2);
}

.btn-loading:focus:active:active:active:active:active:active:active:focus:hover {
  background-color: #66b1ff;
}

.btn-loading:focus:active:active:active:active:active:active:active:focus:disabled {
  background-color: #abada9;
  cursor: not-allowed;
}

.btn-loading:focus:active:active:active:active:active:active:active:focus:disabled:hover {
  background-color: #999;
  color: #666;
}

.btn-loading:focus:active:active:active:active:active:active:active:active {
  background-color: #66b1ff;
}

.btn-loading:focus:active:active:active:active:active:active:active:hover {
  background-color: #3399ff;
}

.btn-loading:focus:active:active:active:active:active:active:active:disabled {
  background-color: #abada9;
  cursor: not-allowed;
}

.btn-loading:focus:active:active:active:active:active:active:active:disabled:hover {
  background-color: #999;
  color: #666;
}

.btn-loading:focus:active:active:active:active:active:active:active:focus {
  outline: none;
  box-shadow: 0 0 0 2px rgba(199, 0, 25, 0.2);
}

.btn-loading:focus:active:active:active:active:active:active:active:focus:hover {
  background-color: #66b1ff;
}

.btn-loading:focus:active:active:active:active:active:active:active:focus:disabled {
  background-color: #abada9;
  cursor: not-allowed;
}

.btn-loading:focus:active:active:active:active:active:active:active:focus:disabled:hover {
  background-color: #999;
  color: #666;
}

.btn-loading:focus:active:active:active:active:active:active:active:active {
  background-color: #66b1ff;
}

.btn-loading:focus:active:active:active:active:active:active:active:hover {
  background-color: #3399ff;
}

.btn-loading:focus:active:active:active:active:active:active:active:disabled {
  background-color: #abada9;
  cursor: not-allowed;
}

.btn-loading:focus:active:active:active:active:active:active:active:disabled:hover {
  background-color: #999;
  color: #666;
}

.btn-loading:focus:active:active:active:active:active:active:active:focus {
  outline: none;
  box-shadow: 0 0 0 2px rgba(199, 0, 25, 0.2);
}

.btn-loading:focus:active:active:active:active:active:active:active:focus:hover {
  background-color: #66b1ff;
}

.btn-loading:focus:active:active:active:active:active:active:active:focus:disabled {
  background-color: #abada9;
  cursor: not-allowed;
}

.btn-loading:focus:active:active:active:active:active:active:active:focus:disabled:hover {
  background-color: #999;
  color: #666;
}

.btn-loading:focus:active:active:active:active:active:active:active:active {
  background-color: #66b1ff;
}

.btn-loading:focus:active:active:active:active:active:active:active:hover {
  background-color: #3399ff;
}

.btn-loading:focus:active:active:active:active:active:active:active:disabled {
  background-color: #abada9;
  cursor: not-allowed;
}

.btn-loading:focus:active:active:active:active:active:active:active:disabled:hover {
  background-color: #999;
  color: #666;
}

.btn-loading:focus:active:active:active:active:active:active:active:focus {
  outline: none;
  box-shadow: 0 0 0 2px rgba(199, 0, 25, 0.2);
}

.btn-loading:focus:active:active:active:active:active:active:active:focus:hover {
  background-color: #66b1ff;
}

.btn-loading:focus:active:active:active:active:active:active:active:focus:disabled {
  background-color: #abada9;
  cursor: not-allowed;
}

.btn-loading:focus:active:active:active:active:active:active:active:focus:disabled:hover {
  background-color: #999;
  color: #666;
}

.btn-loading:focus:active:active:active:active:active:active:active:active {
  background-color: #66b1ff;
}

.btn-loading:focus:active:active:active:active:active:active:active:hover {
  background-color: #3399ff;
}

.btn-loading:focus:active:active:active:active:active:active:active:disabled {
  background-color: #abada9;
  cursor: not-allowed;
}

.btn-loading:focus:active:active:active:active:active:active:active:disabled:hover {
  background-color: #999;
  color: #666;
}

.btn-loading:focus:active:active:active:active:active:active:active:focus {
  outline: none;
  box-shadow: 0 0 0 2px rgba(199, 0, 25, 0.2);
}

.btn-loading:focus:active:active:active:active:active:active:active:focus:hover {
  background-color: #66b1ff;
}

.btn-loading:focus:active:active:active:active:active:active:active:focus:disabled {
  background-color: #abada9;
  cursor: not-allowed;
}

.btn-loading:focus:active:active:active:active:active:active:active:focus:disabled:hover {
  background-color: #999;
  color: #666;
}

.btn-loading:focus:active:active:active:active:active:active:active:active {
  background-color: #66b1ff;
}

.btn-loading:focus:active:active:active:active:active:active:active:hover {
  background-color: #3399ff;
}

.btn-loading:focus:active:active:active:active:active:active:active:disabled {
  background-color: #abada9;
  cursor: not-allowed;
}

.btn-loading:focus:active:active:active:active:active:active:active:disabled:hover {
  background-color: #999;
  color: #666;
}

.btn-loading:focus:active:active:active:active:active:active:active:focus {
  outline: none;
  box-shadow: 0 0 0 2px rgba(199, 0, 25, 0.2);
}

.btn-loading:focus:active:active:active:active:active:active:active:focus:hover {
  background-color: #66b1ff;
}

.btn-loading:focus:active:active:active:active:active:active:active:focus:disabled {
  background-color: #abada9;
  cursor: not-allowed;
}

.btn-loading:focus:active:active:active:active:active:active:active:focus:disabled:hover {
  background-color: #999;
  color: #666;
}

.btn-loading:focus:active:active:active:active:active:active:active:active {
  background-color: #66b1ff;
}

.btn-loading:focus:active:active:active:active:active:active:active:hover {
  background-color: #3399ff;
}

.btn-loading:focus:active:active:active:active:active:active:active:disabled {
  background-color: #abada9;
  cursor: not-allowed;
}

.btn-loading:focus:active:active:active:active:active:active:active:disabled:hover {
  background-color: #999;
  color: #666;
}

.btn-loading:focus:active:active:active:active:active:active:active:focus {
  outline: none;
  box-shadow: 0 0 0 2px rgba(199, 0, 25, 0.2);
}

.btn-loading:focus:active:active:active:active:active:active:active:focus:hover {
  background-color: #66b1ff;
}

.btn-loading:focus:active:active:active:active:active:active:active:focus:disabled {
  background-color: #abada9;
  cursor: not-allowed;
}

.btn-loading:focus:active:active:active:active:active:active:active:focus:disabled:hover {
  background-color: #999;
  color: #666;
}

.btn-loading:focus:active:active:active:active:active:active:active:active {
  background-color: #66b1ff;
}

.btn-loading:focus:active:active:active:active:active:active:active:hover {
  background-color: #3399ff;
}

.btn-loading:focus:active:active:active:active:active:active:active:disabled {
  background-color: #abada9;
  cursor: not-allowed;
}

.btn-loading:focus:active:active:active:active:active:active:active:disabled:hover {
  background-color: #999;
  color: #666;
}

.btn-loading:focus:active:active:active:active:active:active:active:focus {
  outline: none;
  box-shadow: 0 0 0 2px rgba(199, 0, 25, 0.2);
}

.btn-loading:focus:active:active:active:active:active:active:active:focus:hover {
  background-color: #66b1ff;
}

.btn-loading:focus:active:active:active:active:active:active:active:focus:disabled {
  background-color: #abada9;
  cursor: not-allowed;
}

.btn-loading:focus:active:active:active:active:active:active:active:focus:disabled:hover {
  background-color: #999;
  color: #666;
}

.btn-loading:focus:active:active:active:active:active:active:active:active {
  background-color: #66b1ff;
}

.btn-loading:focus:active:active:active:active:active:active:active:hover {
  background-color: #3399ff;
}

.btn-loading:focus:active:active:active:active:active:active:active:disabled {
  background-color: #abada9;
  cursor: not-allowed;
}

.btn-loading:focus:active:active:active:active:active:active:active:disabled:hover {
  background-color: #999;
  color: #666;
}

.btn-loading:focus:active:active:active:active:active:active:active:focus {
  outline: none;
  box-shadow: 0 0 0 2px rgba(199, 0, 25, 0.2);
}

.btn-loading:focus:active:active:active:active:active:active:active:focus:hover {
  background-color: #66b1ff;
}

.btn-loading:focus:active:active:active:active:active:active:active:focus:disabled {
  background-color: #abada9;
  cursor: not-allowed;
}

.btn-loading:focus:active:active:active:active:active:active:active:focus:disabled:hover {
  background-color: #999;
  color: #666;
}

.btn-loading:focus:active:active:active:active:active:active:active:active {
  background-color: #66b1ff;
}

.btn-loading:focus:active:active:active:active:active:active:active:hover {
  background-color: #3399ff;
}

.btn-loading:focus:active:active:active:active:active:active:active:disabled {
  background-color: #abada9;
  cursor: not-allowed;
}

.btn-loading:focus:active:active:active:active:active:active:active:disabled:hover {
  background-color: #999;
  color: #666;
}

.btn-loading:focus:active:active:active:active:active:active:active:focus {
  outline: none;
  box-shadow: 0 0 0 2px rgba(199, 0, 25, 0.2);
}

.btn-loading:focus:active:active:active:active:active:active:active:focus:hover {
  background-color: #66b1ff;
}

.btn-loading:focus:active:active:active:active:active:active:active:focus:disabled {
  background-color: #abada9;
  cursor: not-allowed;
}

.btn-loading:focus:active:active:active:active:active:active:active:focus:disabled:hover {
  background-color: #999;
  color: #666;
}

.btn-loading:focus:active:active:active:active:active:active:active:active {
  background-color: #66b1ff;
}

.btn-loading:focus:active:active:active:active:active:active:active:hover {
  background-color: #3399ff;
}

.btn-loading:focus:active:active:active:active:active:active:active:disabled {
  background-color: #abada9;
  cursor: not-allowed;
}

.btn-loading:focus:active:active:active:active:active:active:active:disabled:hover {
  background-color: #999;
  color: #666;
}

.btn-loading:focus:active:active:active:active:active:active:active:focus {
  outline: none;
  box-shadow: 0 0 0 2px rgba(199, 0, 25, 0.2);
}

.btn-loading:focus:active:active:active:active:active:active:active:focus:hover {
  background-color: #66b1ff;
}

.btn-loading:focus:active:active:active:active:active:active:active:focus:disabled {
  background-color: #abada9;
  cursor: not-allowed;
}

.btn-loading:focus:active:active:active:active:active:active:active:focus:disabled:hover {
  background-color: #999;
  color: #666;
}

.btn-loading:focus:active:active:active:active:active:active:active:active {
  background-color: #66b1ff;
}

.btn-loading:focus:active:active:active:active:active:active:active:hover {
  background-color: #3399ff;
}

.btn-loading:focus:active:active:active:active:active:active:active:disabled {
  background-color: #abada9;
  cursor: not-allowed;
}

.btn-loading:focus:active:active:active:active:active:active:active:disabled:hover {
  background-color: #999;
  color: #666;
}

.btn-loading:focus:active:active:active:active:active:active:active:focus {
  outline: none;
  box-shadow: 0 0 0 2px rgba(199, 0, 25, 0.2);
}

.btn-loading:focus:active:active:active:active:active:active:active:focus:hover {
  background-color: #66b1ff;
}

.btn-loading:focus:active:active:active:active:active:active:active:focus:disabled {
  background-color: #abada9;
  cursor: not-allowed;
}

.btn-loading:focus:active:active:active:active:active:active:active:focus:disabled:hover {
  background-color: #999;
  color: #666;
}

.btn-loading:focus:active:active:active:active:active:active:active:active {
  background-color: #66b1ff;
}

.btn-loading:focus:active:active:active:active:active:active:active:hover {
  background-color: #3399ff;
}

.btn-loading:focus:active:active:active:active:active:active:active:disabled {
  background-color: #abada9;
  cursor: not-allowed;
}

.btn-loading:focus:active:active:active:active:active:active:active:disabled:hover {
  background-color: #999;
  color: #666;
}

.btn-loading:focus:active:active:active:active:active:active:active:focus {
  outline: none;
  box-shadow: 0 0 0 2px rgba(199, 0, 25, 0.2);
}

.btn-loading:focus:active:active:active:active:active:active:active:focus:hover {
  background-color: #66b1ff;
}

.btn-loading:focus:active:active:active:active:active:active:active:focus:disabled {
  background-color: #abada9;
  cursor: not-allowed;
}

.btn-loading:focus:active:active:active:active:active:active:active:focus:disabled:hover {
  background-color: #999;
  color: #666;
}

.btn-loading:focus:active:active:active:active:active:active:active:active {
  background-color: #66b1ff;
}

.btn-loading:focus:active:active:active:active:active:active:active:hover {
  background-color: #3399ff;
}

.btn-loading:focus:active:active:active:active:active:active:active:disabled {
  background-color: #abada9;
  cursor: not-allowed;
}

.btn-loading:focus:active:active:active:active:active:active:active:disabled:hover {
  background-color: #999;
  color: #666;
}

.btn-loading:focus:active:active:active:active:active:active:active:focus {
  outline: none;
  box-shadow: 0 0 0 2px rgba(199, 0, 25, 0.2);
}

.btn-loading:focus:active:active:active:active:active:active:active:focus:hover {
  background-color: #66b1ff;
}

.btn-loading:focus:active:active:active:active:active:active:active:focus:disabled {
  background-color: #abada9;
  cursor: not-allowed;
}

.btn-loading:focus:active:active:active:active:active:active:active:focus:disabled:hover {
  background-color: #999;
  color: #666;
}

.btn-loading:focus:active:active:active:active:active:active:active:active {
  background-color: #66b1ff;
}

.btn-loading:focus:active:active:active:active:active:active:active:hover {
  background-color: #3399ff;
}

.btn-loading:focus:active:active:active:active:active:active:active:disabled {
  background-color: #abada9;
  cursor: not-allowed;
}

.btn-loading:focus:active:active:active:active:active:active:active:disabled:hover {
  background-color: #999;
  color: #666;
}

.btn-loading:focus:active:active:active:active:active:active:active:focus {
  outline: none;
  box-shadow: 0 0 0 2px rgba(199, 0, 25, 0.2);
}

.btn-loading:focus:active:active:active:active:active:active:active:focus:hover {
  background-color: #66b1ff;
}

.btn-loading:focus:active:active:active:active:active:active:active:focus:disabled {
  background-color: #abada9;
  cursor: not-allowed;
}

.btn-loading:focus:active:active:active:active:active:active:active:focus:disabled:hover {
  background-color: #999;
  color: #666;
}

.btn-loading:focus:active:active:active:active:active:active:active:active {
  background-color: #66b1ff;
}

.btn-loading:focus:active:active:active:active:active:active:active:hover {
  background-color: #3399ff;
}

.btn-loading:focus:active:active:active:active:active:active:active:disabled {
  background-color: #abada9;
  cursor: not-allowed;
}

.btn-loading:focus:active:active:active:active:active:active:active:disabled:hover {
  background-color: #999;
  color: #666;
}

.btn-loading:focus:active:active:active:active:active:active:active:focus {
  outline: none;
  box-shadow: 0 0 0 2px rgba(199, 0, 25, 0.2);
}

.btn-loading:focus:active:active:active:active:active:active:active:focus:hover {
  background-color: #66b1ff;
}

.btn-loading:focus:active:active:active:active:active:active:active:focus:disabled {
  background-color: #abada9;
  cursor: not-allowed;
}

.btn-loading:focus:active:active:active:active:active:active:active:focus:disabled:hover {
  background-color: #999;
  color: #666;
}

.btn-loading:focus:active:active:active:active:active:active:active:active {
  background-color: #66b1ff;
}

.btn-loading:focus:active:active:active:active:active:active:active:hover {
  background-color: #3399ff;
}

.btn-loading:focus:active:active:active:active:active:active:active:disabled {
  background-color: #abada9;
  cursor: not-allowed;
}

.btn-loading:focus:active:active:active:active:active:active:active:disabled:hover {
  background-color: #999;
  color: #666;
}

.btn-loading:focus:active:active:active:active:active:active:active:focus {
  outline: none;
  box-shadow: 0 0 0 2px rgba(199, 0, 25, 0.2);
}

.btn-loading:focus:active:active:active:active:active:active:active:focus:hover {
  background-color: #66b1ff;
}

.btn-loading:focus:active:active:active:active:active:active:active:focus:disabled {
  background-color: #abada9;
  cursor: not-allowed;
}

.btn-loading:focus:active:active:active:active:active:active:active:focus:disabled:hover {
  background-color: #999;
  color: #666;
}

.btn-loading:focus:active:active:active:active:active:active:active:active {
  background-color: #66b1ff;
}

.btn-loading:focus:active:active:active:active:active:active:active:hover {
  background-color: #3399ff;
}

.btn-loading:focus:active:active:active:active:active:active:active:disabled {
  background-color: #abada9;
  cursor: not-allowed;
}

.btn-loading:focus:active:active:active:active:active:active:active:disabled:hover {
  background-color: #999;
  color: #666;
}

.btn-loading:focus:active:active:active:active:active:active:active:focus {
  outline: none;
  box-shadow: 0 0 0 2px rgba(199, 0, 25, 0.2);
}

.btn-loading:focus:active:active:active:active:active:active:active:focus:hover {
  background-color: #66b1ff;
}

.btn-loading:focus:active:active:active:active:active:active:active:focus:disabled {
  background-color: #abada9;
  cursor: not-allowed;
}

.btn-loading:focus:active:active:active:active:active:active:active:focus:disabled:hover {
  background-color: #999;
  color: #666;
}

.btn-loading:focus:active:active:active:active:active:active:active:active {
  background-color: #66b1ff;
}

.btn-loading:focus:active:active:active:active:active:active:active:hover {
  background-color: #3399ff;
}

.btn-loading:focus:active:active:active:active:active:active:active:disabled {
  background-color: #abada9;
  cursor: not-allowed;
}

.btn-loading:focus:active:active:active:active:active:active:active:disabled:hover {
  background-color: #999;
  color: #666;
}

.btn-loading:focus:active:active:active:active:active:active:active:focus {
  outline: none;
  box-shadow: 0 0 0 2px rgba(199, 0, 25, 0.2);
}

.btn-loading:focus:active:active:active:active:active:active:active:focus:hover {
  background-color: #66b1ff;
}

.btn-loading:focus:active:active:active:active:active:active:active:focus:disabled {
  background-color: #abada9;
  cursor: not-allowed;
}

.btn-loading:focus:active:active:active:active:active:active:active:focus:disabled:hover {
  background-color: #999;
  color: #666;
}

.btn-loading:focus:active:active:active:active:active:active:active:active {
  background-color: #66b1ff;
}

.btn-loading:focus:active:active:active:active:active:active:active:hover {
  background-color: #3399ff;
}

.btn-loading:focus:active:active:active:active:active:active:active:disabled {
  background-color: #abada9;
  cursor: not-allowed;
}

.btn-loading:focus:active:active:active:active:active:active:active:disabled:hover {
  background-color: #999;
  color: #666;
}

.btn-loading:focus:active:active:active:active:active:active:active:focus {
  outline: none;
  box-shadow: 0 0 0 2px rgba(199, 0, 25, 0.2);
}

.btn-loading:focus:active:active:active:active:active:active:active:focus:hover {
  background-color: #66b1ff;
}

.btn-loading:focus:active:active:active:active:active:active:active:focus:disabled {
  background-color: #abada9;
  cursor: not-allowed;
}

.btn-loading:focus:active:active:active:active:active:active:active:focus:disabled:hover {
  background-color: #999;
  color: #666;
}

.btn-loading:focus:active:active:active:active:active:active:active:active {
  background-color: #66b1ff;
}

.btn-loading:focus:active:active:active:active:active:active:active:hover {
  background-color: #3399ff;
}

.btn-loading:focus:active:active:active:active:active:active:active:disabled {
  background-color: #abada9;
  cursor: not-allowed;
}

.btn-loading:focus:active:active:active:active:active:active:active:disabled:hover {
  background-color: #999;
  color: #666;
}

.btn-loading:focus:active:active:active:active:active:active:active:focus {
  outline: none;
  box-shadow: 0 0 0 2px rgba(199, 0, 25, 0.2);
}

.btn-loading:focus:active:active:active:active:active:active:active:focus:hover {
  background-color: #66b1ff;
}

.btn-loading:focus:active:active:active:active:active:active:active:focus:disabled {
  background-color: #abada9;
  cursor: not-allowed;
}

.btn-loading:focus:active:active:active:active:active:active:active:focus:disabled:hover {
  background-color: #999;
  color: #666;
}

.btn-loading:focus:active:active:active:active:active:active:active:active {
  background-color: #66b1ff;
}

.btn-loading:focus:active:active:active:active:active:active:active:hover {
  background-color: #3399ff;
}

.btn-loading:focus:active:active:active:active:active:active:active:disabled {
  background-color: #abada9;
  cursor: not-allowed;
}

.btn-loading:focus:active:active:active:active:active:active:active:disabled:hover {
  background-color: #999;
  color: #666;
}

.btn-loading:focus:active:active:active:active:active:active:active:focus {
  outline: none;
  box-shadow: 0 0 0 2px rgba(199, 0, 25, 0.2);
}

.btn-loading:focus:active:active:active:active:active:active:active:focus:hover {
  background-color: #66b1ff;
}

.btn-loading:focus:active:active:active:active:active:active:active:focus:disabled {
  background-color: #abada9;
  cursor: not-allowed;
}

.btn-loading:focus:active:active:active:active:active:active:active:focus:disabled:hover {
  background-color: #999;
  color: #666;
}

.btn-loading:focus:active:active:active:active:active:active:active:active {
  background-color: #66b1ff;
}

.btn-loading:focus:active:active:active:active:active:active:active:hover {
  background-color: #3399ff;
}

.btn-loading:focus:active:active:active:active:active:active:active:disabled {
  background-color: #abada9;
  cursor: not-allowed;
}

.btn-loading:focus:active:active:active:active:active:active:active:disabled:hover {
  background-color: #999;
  color: #666;
}

.btn-loading:focus:active:active:active:active:active:active:active:focus {
  outline: none;
  box-shadow: 0 0 0 2px rgba(199, 0, 25, 0.2);
}

.btn-loading:focus:active:active:active:active:active:active:active:focus:hover {
  background-color: #66b1ff;
}

.btn-loading:focus:active:active:active:active:active:active:active:focus:disabled {
  background-color: #abada9;
  cursor: not-allowed;
}

.btn-loading:focus:active:active:active:active:active:active:active:focus:disabled:hover {
  background-color: #999;
  color: #666;
}

.btn-loading:focus:active:active:active:active:active:active:active:active {
  background-color: #66b1ff;
}

.btn-loading:focus:active:active:active:active:active:active:active:hover {
  background-color: #3399ff;
}

.btn-loading:focus:active:active:active:active:active:active:active:disabled {
  background-color: #abada9;
  cursor: not-allowed;
}

.btn-loading:focus:active:active:active:active:active:active:active:disabled:hover {
  background-color: #999;
  color: #666;
}

.btn-loading:focus:active:active:active:active:active:active:active:focus {
  outline: none;
  box-shadow: 0 0 0 2px rgba(199, 0, 25, 0.2);
}

.btn-loading:focus:active:active:active:active:active:active:active:focus:hover {
  background-color: #66b1ff;
}

.btn-loading:focus:active:active:active:active:active:active:active:focus:disabled {
  background-color: #abada9;
  cursor: not-allowed;
}

.btn-loading:focus:active:active:active:active:active:active:active:focus:disabled:hover {
  background-color: #999;
  color: #666;
}

.btn-loading:focus:active:active:active:active:active:active:active:active {
  background-color: #66b1ff;
}

.btn-loading:focus:active:active:active:active:active:active:active:hover {
  background-color: #3399ff;
}

.btn-loading:focus:active:active:active:active:active:active:active:disabled {
  background-color: #abada9;
  cursor: not-allowed;
}

.btn-loading:focus:active:active:active:active:active:active:active:disabled:hover {
  background-color: #999;
  color: #666;
}

.btn-loading:focus:active:active:active:active:active:active:active:focus {
  outline: none;
  box-shadow: 0 0 0 2px rgba(199, 0, 25, 0.2);
}

.btn-loading:focus:active:active:active:active:active:active:active:focus:hover {
  background-color: #66b1ff;
}

.btn-loading:focus:active:active:active:active:active:active:active:focus:disabled {
  background-color: #abada9;
  cursor: not-allowed;
}

.btn-loading:focus:active:active:active:active:active:active:active:focus:disabled:hover {
  background-color: #999;
  color: #666;
}

.btn-loading:focus:active:active:active:active:active:active:active:active {
  background-color: #66b1ff;
}

.btn-loading:focus:active:active:active:active:active:active:active:hover {
  background-color: #3399ff;
}

.btn-loading:focus:active:active:active:active:active:active:active:disabled {
  background-color: #abada9;
  cursor: not-allowed;
}

.btn-loading:focus:active:active:active:active:active:active:active:disabled:hover {
  background-color: #999;
  color: #666;
}

.btn-loading:focus:active:active:active:active:active:active:active:focus {
  outline: none;
  box-shadow: 0 0 0 2px rgba(199, 0, 25, 0.2);
}

.btn-loading:focus:active:active:active:active:active:active:active:focus:hover {
  background-color: #66b1ff;
}

.btn-loading:focus:active:active:active:active:active:active:active:focus:disabled {
  background-color: #abada9;
  cursor: not-allowed;
}

.btn-loading:focus:active:active:active:active:active:active:active:focus:disabled:hover {
  background-color: #999;
  color: #666;
}

.btn-loading:focus:active:active:active:active:active:active:active:active {
  background-color: #66b1ff;
}

.btn-loading:focus:active:active:active:active:active:active:active:hover {
  background-color: #3399ff;
}

.btn-loading:focus:active:active:active:active:active:active:active:disabled {
  background-color: #abada9;
  cursor: not-allowed;
}

.btn-loading:focus:active:active:active:active:active:active:active:disabled:hover {
  background-color: #999;
  color: #666;
}

.btn-loading:focus:active:active:active:active:active:active:active:focus {
  outline: none;
  box-shadow: 0 0 0 2px rgba(199, 0, 25, 0.2);
}

.btn-loading:focus:active:active:active:active:active:active:active:focus:hover {
  background-color: #66b1ff;
}

.btn-loading:focus:active:active:active:active:active:active:active:focus:disabled {
  background-color: #abada9;
  cursor: not-allowed;
}

.btn-loading:focus:active:active:active:active:active:active:active:focus:disabled:hover {
  background-color: #999;
  color: #666;
}

.btn-loading:focus:active:active:active:active:active:active:active:active {
  background-color: #66b1ff;
}

.btn-loading:focus:active:active:active:active:active:active:active:hover {
  background-color: #3399ff;
}

.btn-loading:focus:active:active:active:active:active:active:active:disabled {
  background-color: #abada9;
  cursor: not-allowed;
}

.btn-loading:focus:active:active:active:active:active:active:active:disabled:hover {
  background-color: #999;
  color: #666;
}

.btn-loading:focus:active:active:active:active:active:active:active:focus {
  outline: none;
  box-shadow: 0 0 0 2px rgba(199, 0, 25, 0.2);
}

.btn-loading:focus:active:active:active:active:active:active:active:focus:hover {
  background-color: #66b1ff;
}

.btn-loading:focus:active:active:active:active:active:active:active:focus:disabled {
  background-color: #abada9;
  cursor: not-allowed;
}

.btn-loading:focus:active:active:active:active:active:active:active:focus:disabled:hover {
  background-color: #999;
  color: #666;
}

.btn-loading:focus:active:active:active:active:active:active:active:active {
  background-color: #66b1ff;
}

.btn-loading:focus:active:active:active:active:active:active:active:hover {
  background-color: #3399ff;
}

.btn-loading:focus:active:active:active:active:active:active:active:disabled {
  background-color: #abada9;
  cursor: not-allowed;
}

.btn-loading:focus:active:active:active:active:active:active:active:disabled:hover {
  background-color: #999;
  color: #666;
}

.btn-loading:focus:active:active:active:active:active:active:active:focus {
  outline: none;
  box-shadow: 0 0 0 2px rgba(199, 0, 25, 0.2);
}

.btn-loading:focus:active:active:active:active:active:active:active:focus:hover {
  background-color: #66b1ff;
}

.btn-loading:focus:active:active:active:active:active:active:active:focus:disabled {
  background-color: #abada9;
  cursor: not-allowed;
}

.btn-loading:focus:active:active:active:active:active:active:active:focus:disabled:hover {
  background-color: #999;
  color: #666;
}

.btn-loading:focus:active:active:active:active:active:active:active:active {
  background-color: #66b1ff;
}

.btn-loading:focus:active:active:active:active:active:active:active:hover {
  background-color: #3399ff;
}

.btn-loading:focus:active:active:active:active:active:active:active:disabled {
  background-color: #abada9;
  cursor: not-allowed;
}

.btn-loading:focus:active:active:active:active:active:active:active:disabled:hover {
  background-color: #999;
  color: #666;
}

.btn-loading:focus:active:active:active:active:active:active:active:focus {
  outline: none;
  box-shadow: 0 0 0 2px rgba(199, 0, 25, 0.2);
}

.btn-loading:focus:active:active:active:active:active:active:active:focus:hover {
  background-color: #66b1ff;
}

.btn-loading:focus:active:active:active:active:active:active:active:focus:disabled {
  background-color: #abada9;
  cursor: not-allowed;
}

.btn-loading:focus:active:active:active:active:active:active:active:focus:disabled:hover {
  background-color: #999;
  color: #666;
}

.btn-loading:focus:active:active:active:active:active:active:active:active {
  background-color: #66b1ff;
}

.btn-loading:focus:active:active:active:active:active:active:active:hover {
  background-color: #3399ff;
}

.btn-loading:focus:active:active:active:active:active:active:active:disabled {
  background-color: #abada9;
  cursor: not-allowed;
}

.btn-loading:focus:active:active:active:active:active:active:active:disabled:hover {
  background-color: #999;
  color: #666;
}

.btn-loading:focus:active:active:active:active:active:active:active:focus {
  outline: none;
  box-shadow: 0 0 0 2px rgba(199, 0, 25, 0.2);
}

.btn-loading:focus:active:active:active:active:active:active:active:focus:hover {
  background-color: #66b1ff;
}

.btn-loading:focus:active:active:active:active:active:active:active:focus:disabled {
  background-color: #abada9;
  cursor: not-allowed;
}

.btn-loading:focus:active:active:active:active:active:active:active:focus:disabled:hover {
  background-color: #999;
  color: 】 #666;
}

.btn-loading:focus:active:active:active:active:active:active:active:active {
  background-color: #66b1ff;
}

.btn-loading:focus:active:active:active:active:active:active:active:hover {
  background-color: #3399ff;
}

.btn-loading:focus:active:active:active:active:active:active:active:disabled {
  background-color: #abada9;
  cursor: not-allowed;
}

.btn-loading:focus:active:active:active:active:active:active:active:disabled:hover {
  background-color: #999;
  color: #666;
}

.btn-loading:focus:active:active:active:active:active:active:active:focus {
  outline: none;
  box-shadow: 0 0 0 2px rgba(199, 0, 25, 0.2);
}

.btn-loading:focus:active:active:active:active:active:active:active:focus:hover {
  background-color: #66b1ff;
}

.btn-loading:focus:active:active:active:active:active:active:active:focus:disabled {
  background-color: #abada9;
  cursor: not-allowed;
}

.btn-loading:focus:active:active:active:active:active:active:active:focus:disabled:hover {
  background-color: #999;
  color: #666;
}

.btn-loading:focus:active:active:active:active:active:active:active:active {
  background-color: #66b1ff;
}

.btn-loading:focus:active:active:active:active:active:active:active:hover {
  background-color: #3399ff;
}

.btn-loading:focus:active:active:active:active:active:active:active:disabled {
  background-color: #abada9;
  cursor: not-allowed;
}

.btn-loading:focus:active:active:active:active:active:active:active:disabled:hover {
  background-color: #999;
  color: #666;
}

.btn-loading:focus:active:active:active:active:active:active:active:focus {
  outline: none;
  box-shadow: 0 0 0 2px rgba(199, 0, 25, 0.2);
}

.btn-loading:focus:active:active:active:active:active:active:active:focus:hover {
  background-color: #66b1ff;
}

.btn-loading:focus:active:active:active:active:active:active:active:focus:disabled {
  background-color: #abada9;
  cursor: not-allowed;
}

.btn-loading:focus:active:active:active:active:active:active:active:focus:disabled:hover {
  background-color: #999;
  color: #666;
}

.btn-loading:focus:active:active:active:active:active:active:active:active {
  background-color: #66b1ff;
}

.btn-loading:focus:active:active:active:active:active:active:active:hover {
  background-color: #3399ff;
}

.btn-loading:focus:active:active:active:active:active:active:active:disabled {
  background-color: #abada9;
  cursor: not-allowed;
}

.btn-loading:focus:active:active:active:active:active:active:active:disabled:hover {
  background-color: #999;
  color: #666;
}

.btn-loading:focus:active:active:active:active:active:active:active:focus {
  outline: none;
  box-shadow: 0 0 0 2px rgba(199, 0, 25, 0.2);
}

.btn-loading:focus:active:active:active:active:active:active:active:focus:hover {
  background-color: #66b1ff;
}

.btn-loading:focus:active:active:active:active:active:active:active:focus:disabled {
  background-color: #abada9;
  cursor: not-allowed;
}

.btn-loading:focus:active:active:active:active:active:active:active:focus:disabled:hover {
  background-color: #999;
  color: #666;
}

.btn-loading:focus:active:active:active:active:active:active:active:active {
  background-color: #66b1ff;
}

.btn-loading:focus:active:active:active:active:active:active:active:hover {
  background-color: #3399ff;
}

.btn-loading:focus:active:active:active:active:active:active:active:disabled {
  background-color: #abada9;
  cursor: not-allowed;
}

.btn-loading:focus:active:active:active:active:active:active:active:disabled:hover {
  background-color: #999;
  color: #666;
}

.btn-loading:focus:active:active:active:active:active:active:active:focus {
  outline: none;
  box-shadow: 0 0 0 2px rgba(199, 0, 25, 0.2);
}

.btn-loading:focus:active:active:active:active:active:active:active:focus:hover {
  background-color: #66b1ff;
}

.btn-loading:focus:active:active:active:active:active:active:active:focus:disabled {
  background-color: #abada9;
  cursor: not-allowed;
}

.btn-loading:focus:active:active:active:active:active:active:active:focus:disabled:hover {
  background-color: #999;
  color: #666;
}

.btn-loading:focus:active:active:active:active:active:active:active:active {
  background-color: #66b1ff;
}

.btn-loading:focus:active:active:active:active:active:active:active:hover {
  background-color: #3399ff;
}

.btn-loading:focus:active:active:active:active:active:active:active:disabled {
  background-color: #abada9;
  cursor: not-allowed;
}

.btn-loading:focus:active:active:active:active:active:active:active:disabled:hover {
  background-color: #999;
  color: #666;
}

.btn-loading:focus:active:active:active:active:active:active:active:focus {
  outline: none;
  box-shadow: 0 0 0 2px rgba(199, 0, 25, 0.2);
}

.btn-loading:focus:active:active:active:active:active:active:active:focus:hover {
  background-color: #66b1ff;
}

.btn-loading:focus:active:active:active:active:active:active:active:focus:disabled {
  background-color: #abada9;
  cursor: not-allowed;
}

.btn-loading:focus:active:active:active:active:active:active:active:focus:disabled:hover {
  background-color: #999;
  color: #666;
}

.btn-loading:focus:active:active:active:active:active:active:active:active {
  background-color: #66b1ff;
}

.btn-loading:focus:active:active:active:active:active:active:active:hover {
  background-color: #3399ff;
}

.btn-loading:focus:active:active:active:active:active:active:active:disabled {
  background-color: #abada9;
  cursor: not-allowed;
}

.btn-loading:focus:active:active:active:active:active:active:active:disabled:hover {
  background-color: #999;
  color: #666;
}

.btn-loading:focus:active:active:active:active:active:active:active:focus {
  outline: none;
  box-shadow: 0 0 0 2px rgba(199, 0, 25, 0.2);
}

.btn-loading:focus:active:active:active:active:active:active:active:focus:hover {
  background-color: #66b1ff;
}

.btn-loading:focus:active:active:active:active:active:active:active:focus:disabled {
  background-color: #abada9;
  cursor: not-allowed;
}

.btn-loading:focus:active:active:active:active:active:active:active:focus:disabled:hover {
  background-color: #999;
  color: #666;
}

.btn-loading:focus:active:active:active:active:active:active:active:active {
  background-color: #66b1ff;
}

.btn-loading:focus:active:active:active:active:active:active:active:hover {
  background-color: #3399ff;
}

.btn-loading:focus:active:active:active:active:active:active:active:disabled {
  background-color: #abada9;
  cursor: not-allowed;
}

.btn-loading:focus:active:active:active:active:active:active:active:disabled:hover {
  background-color: #999;
  color: #666;
}

.btn-loading:focus:active:active:active:active:active:active:active:focus {
  outline: none;
  box-shadow: 0 0 0 2px rgba(199, 0, 25, 0.2);
}

.btn-loading:focus:active:active:active:active:active:active:active:focus:hover {
  background-color: #66b1ff;
}

.btn-loading:focus:active:active:active:active:active:active:active:focus:disabled {
  background-color: #abada9;
  cursor: not-allowed;
}

.btn-loading:focus:active:active:active:active:active:active:active:focus:disabled:hover {
  background-color: #999;
  color: #666;
}

.btn-loading:focus:active:active:active:active:active:active:active:active {
  background-color: #66b1ff;
}

.btn-loading:focus:active:active:active:active:active:active:active:hover {
  background-color: #3399ff;
}

.btn-loading:focus:active:active:active:active:active:active:active:disabled {
  background-color: #abada9;
  cursor: not-allowed;
}

.btn-loading:focus:active:active:active:active:active:active:active:disabled:hover {
  background-color: #999;
  color: #666;
}

.btn-loading:focus:active:active:active:active:active:active:active:focus {
  outline: none;
  box-shadow: 0 0 0 2px rgba(199, 0, 25, 0.2);
}

.btn-loading:focus:active:active:active:active:active:active:active:focus:hover {
  background-color: #66b1ff;
}

.btn-loading:focus:active:active:active:active:active:active:active:focus:disabled {
  background-color: #abada9;
  cursor: not-allowed;
}

.btn-loading:focus:active:active:active:active:active:active:active:focus:disabled:hover {
  background-color: #999;
  color: #666;
}

.btn-loading:focus:active:active:active:active:active:active:active:active {
  background-color: #66b1ff;
}

.btn-loading:focus:active:active:active:active:active:active:active:hover {
  background-color: #3399ff;
}

.btn-loading:focus:active:active:active:active:active:active:active:disabled {
  background-color: #abada9;
  cursor: not-allowed;
}

.btn-loading:focus:active:active:active:active:active:active:active:disabled:hover {
  background-color: #999;
  color: #666;
}

.btn-loading:focus:active:active:active:active:active:active:active:focus {
  outline: none;
  box-shadow: 0 0 0 2px rgba(199, 0, 25, 0.2);
}

.btn-loading:focus:active:active:active:active:active:active:active:focus:hover {
  background-color: #66b1ff;
}

.btn-loading:focus:active:active:active:active:active:active:active:focus:disabled {
  background-color: #abada9;
  cursor: not-allowed;
}

.btn-loading:focus:active:active:active:active:active:active:active:focus:disabled:hover {
  background-color: #999;
  color: #666;
}

.btn-loading:focus:active:active:active:active:active:active:active:active {
  background-color: #66b1ff;
}

.btn-loading:focus:active:active:active:active:active:active:active:hover {
  background-color: #3399ff;
}

.btn-loading:focus:active:active:active:active:active:active:active:disabled {
  background-color: #abada9;
  cursor: not-allowed;
}

.btn-loading:focus:active:active:active:active:active:active:active:disabled:hover {
  background-color: #999;
  color: #666;
}

.btn-loading:focus:active:active:active:active:active:active:active:focus {
  outline: none;
  box-shadow: 0 0 0 2px rgba(199, 0, 25, 0.2);
}

.btn-loading:focus:active:active:active:active:active:active:active:focus:hover {
  background-color: #66b1ff;
}

.btn-loading:focus:active:active:active:active:active:active:active:focus:disabled {
  background-color: #abada9;
  cursor: not-allowed;
}

.btn-loading:focus:active:active:active:active:active:active:active:focus:disabled:hover {
  background-color: #999;
  color: #666;
}

.btn-loading:focus:active:active:active:active:active:active:active:active {
  background-color: #66b1ff;
}

.btn-loading:focus:active:active:active:active:active:active:active:hover {
  background-color: #3399ff;
}

.btn-loading:focus:active:active:active:active:active:active:active:disabled {
  background-color: #abada9;
  cursor: not-allowed;
}

.btn-loading:focus:active:active:active:active:active:active:active:disabled:hover {
  background-color: #999;
  color: #666;
}

.btn-loading:focus:active:active:active:active:active:active:active:focus {
  outline: none;
  box-shadow: 0 0 0 2px rgba(199, 0, 25, 0.2);
}

.btn-loading:focus:active:active:active:active:active:active:active:focus:hover {
  background-color: #66b1ff;
}

.btn-loading:focus:active:active:active:active:active:active:active:focus:disabled {
  background-color: #abada9;
  cursor: not-allowed;
}

.btn-loading:focus:active:active:active:active:active:active:active:focus:disabled:hover {
  background-color: #999;
  color: #666;
}

.btn-loading:focus:active:active:active:active:active:active:active:active {
  background-color: #66b1ff;
}

.btn-loading:focus:active:active:active:active:active:active:active:hover {
  background-color: #3399ff;
}

.btn-loading:focus:active:active:active:active:active:active:active:disabled {
  background-color: #abada9;
  cursor: not-allowed;
}

.btn-loading:focus:active:active:active:active:active:active:active:disabled:hover {
  background-color: #999;
  color: #666;
}

.btn-loading:focus:active:active:active:active:active:active:active:focus {
  outline: none;
  box-shadow: 0 0 0 2px rgba(199, 0, 25, 0.2);
}

.btn-loading:focus:active:active:active:active:active:active:active:focus:hover {
  background-color: #66b1ff;
}

.btn-loading:focus:active:active:active:active:active:active:active:focus:disabled {
  background-color: #abada9;
  cursor: not-allowed;
}

.btn-loading:focus:active:active:active:active:active:active:active:focus:disabled:hover {
  background-color: #999;
  color: #666;
}

.btn-loading:focus:active:active:active:active:active:active:active:active {
  background-color: #66b1ff;
}

.btn-loading:focus:active:active:active:active:active:active:active:hover {
  background-color: #3399ff;
}

.btn-loading:focus:active:active:active:active:active:active:active:disabled {
  background-color: #abada9;
  cursor: not-allowed;
}

.btn-loading:focus:active:active:active:active:active:active:active:disabled:hover {
  background-color: #999;
  color: #666;
}

.btn-loading:focus:active:active:active:active:active:active:active:focus {
  outline: none;
  box-shadow: 0 0 0 2px rgba(199, 0, 25, 0.2);
}

.btn-loading:focus:active:active:active:active:active:active:active:focus:hover {
  background-color: #66b1ff;
}

.btn-loading:focus:active:active:active:active:active:active:active:focus:disabled {
  background-color: #abada9;
  cursor: not-allowed;
}

.btn-loading:focus:active:active:active:active:active:active:active:focus:disabled:hover {
  background-color: #999;
  color: #666;
}

.btn-loading:focus:active:active:active:active:active:active:active:active {
  background-color: #66b1ff;
}

.btn-loading:focus:active:active:active:active:active:active:active:hover {
  background-color: #3399ff;
}

.btn-loading:focus:active:active:active:active:active:active:active:disabled {
  background-color: #abada9;
  cursor: not-allowed;
}

.btn-loading:focus:active:active:active:active:active:active:active:disabled:hover {
  background-color: #999;
  color: #666;
}

.btn-loading:focus:active:active:active:active:active:active:active:focus {
  outline: none;
  box-shadow: 0 0 0 2px rgba(199, 0, 25, 0.2);
}

.btn-loading:focus:active:active:active:active:active:active:active:focus:hover {
  background-color: #66b1ff;
}

.btn-loading:focus:active:active:active:active:active:active:active:focus:disabled {
  background-color: #abada9;
  cursor: not-allowed;
}

.btn-loading:focus:active:active:active:active:active:active:active:focus:disabled:hover {
  background-color: #999;
  color: #666;
}

.btn-loading:focus:active:active:active:active:active:active:active:active {
  background-color: #66b1ff;
}

.btn-loading:focus:active:active:active:active:active:active:active:hover {
  background-color: #3399ff;
}

.btn-loading:focus:active:active:active:active:active:active:active:disabled {
  background-color: #abada9;
  cursor: not-allowed;
}

.btn-loading:focus:active:active:active:active:active:active:active:disabled:hover {
  background-color: #999;
  color: #666;
}

.btn-loading:focus:active:active:active:active:active:active:active:focus {
  outline: none;
  box-shadow: 0 0 0 2px rgba(199, 0, 25, 0.2);
}

.btn-loading:focus:active:active:active:active:active:active:active:focus:hover {
  background-color: #66b1ff;
}

.btn-loading:focus:active:active:active:active:active:active:active:focus:disabled {
  background-color: #abada9;
  cursor: not-allowed;
}

.btn-loading:focus:active:active:active:active:active:active:active:focus:disabled:hover {
  background-color: #999;
  color: #666;
}

.btn-loading:focus:active:active:active:active:active:active:active:active {
  background-color: #66b1ff;
}

.btn-loading:focus:active:active:active:active:active:active:active:hover {
  background-color: #3399ff;
}

.btn-loading:focus:active:active:active:active:active:active:active:disabled {
  background-color: #abada9;
  cursor: not-allowed;
}

.btn-loading:focus:active:active:active:active:active:active:active:disabled:hover {
  background-color: #999;
  color: #666;
}

.btn-loading:focus:active:active:active:active:active:active:active:focus {
  outline: none;
  box-shadow: 0 0 0 2px rgba(199, 0, 25, 0.2);
}

.btn-loading:focus:active:active:active:active:active:active:active:focus:hover {
  background-color: #66b1ff;
}

.btn-loading:focus:active:active:active:active:active:active:active:focus:disabled {
  background-color: #abada9;
  cursor: not-allowed;
}

.btn-loading:focus:active:active:active:active:active:active:active:focus:disabled:hover {
  background-color: #999;
  color: #666;
}

.btn-loading:focus:active:active:active:active:active:active:active:active {
  background-color: #66b1ff;
}

.btn-loading:focus:active:active:active:active:active:active:active:hover {
  background-color: #3399ff;
}

.btn-loading:focus:active:active:active:active:active:active:active:disabled {
  background-color: #abada9;
  cursor: not-allowed;
}

.btn-loading:focus:active:active:active:active:active:active:active:disabled:hover {
  background-color: #999;
  color: #666;
}

.btn-loading:focus:active:active:active:active:active:active:active:focus {
  outline: none;
  box-shadow: 0 0 0 2px rgba(199, 0, 25, 0.2);
}

.btn-loading:focus:active:active:active:active:active:active:active:focus:hover {
  background-color: #66b1ff;
}

.btn-loading:focus:active:active:active:active:active:active:active:focus:disabled {
  background-color: #abada9;
  cursor: not-allowed;
}

.btn-loading:focus:active:active:active:active:active:active:active:focus:disabled:hover {
  background-color: #999;
  color: #666;
}

.btn-loading:focus:active:active:active:active:active:active:active:active {
  background-color: #66b1ff;
}

.btn-loading:focus:active:active:active:active:active:active:active:hover {
  background-color: #3399ff;
}

.btn-loading:focus:active:active:active:active:active:active:active:disabled {
  background-color: #abada9;
  cursor: not-allowed;
}

.btn-loading:focus:active:active:active:active:active:active:active:disabled:hover {
  background-color: #999;
  color: #666;
}

.btn-loading:focus:active:active:active:active:active:active:active:focus {
  outline: none;
  box-shadow: 0 0 0 2px rgba(199, 0, 25, 0.2);
}

.btn-loading:focus:active:active:active:active:active:active:active:focus:hover {
  background-color: #66b1ff;
}

.btn-loading:focus:active:active:active:active:active:active:active:focus:disabled {
  background-color: #abada9;
  cursor: not-allowed;
}

.btn-loading:focus:active:active:active:active:active:active:active:focus:disabled:hover {
  background-color: #999;
  color: #666;
}

.btn-loading:focus:active:active:active:active:active:active:active:active {
  background-color: #66b1ff;
}

.btn-loading:focus:active:active:active:active:active:active:active:hover {
  background-color: #3399ff;
}

.btn-loading:focus:active:active:active:active:active:active:active:disabled {
  background-color: #abada9;
  cursor: not-allowed;
}

.btn-loading:focus:active:active:active:active:active:active:active:disabled:hover {
  background-color: #999;
  color: #666;
}

.btn-loading:focus:active:active:active:active:active:active:active:focus {
  outline: none;
  box-shadow: 0 0 0 2px rgba(199, 0, 25, 0.2);
}

.btn-loading:focus:active:active:active:active:active:active:active:focus:hover {
  background-color: #66b1ff;
}

.btn-loading:focus:active:active:active:active:active:active:active:focus:disabled {
  background-color: #abada9;
  cursor: not-allowed;
}

.btn-loading:focus:active:active:active:active:active:active:active:focus:disabled:hover {
  background-color: #999;
  color: #666;
}

.btn-loading:focus:active:active:active:active:active:active:active:active {
  background-color: #66b1ff;
}

.btn-loading:focus:active:active:active:active:active:active:active:hover {
  background-color: #3399ff;
}

.btn-loading:focus:active:active:active:active:active:active:active:disabled {
  background-color: #abada9;
  cursor: not-allowed;
}

.btn-loading:focus:active:active:active:active:active:active:active:disabled:hover {
  background-color: #999;
  color: #666;
}

.btn-loading:focus:active:active:active:active:active:active:active:focus {
  outline: none;
  box-shadow: 0 0 0 2px rgba(199, 0, 25, 0.2);
}

.btn-loading:focus:active:active:active:active:active:active:active:focus:hover {
  background-color: #66b1ff;
}

.btn-loading:focus:active:active:active:active:active:active:active:focus:disabled {
  background-color: #abada9;
  cursor: not-allowed;
}

.btn-loading:focus:active:active:active:active:active:active:active:focus:disabled:hover {
  background-color: #999;
  color: #666;
}

.btn-loading:focus:active:active:active:active:active:active:active:active {
  background-color: #66b1ff;
}

.btn-loading:focus:active:active:active:active:active:active:active:hover {
  background-color: #3399ff;
}

.btn-loading:focus:active:active:active:active:active:active:active:disabled {
  background-color: #abada9;
  cursor: not-allowed;
}

.btn-loading:focus:active:active:active:active:active:active:active:disabled:hover {
  background-color: #999;
  color: #666;
}

.btn-loading:focus:active:active:active:active:active:active:active:focus {
  outline: none;
  box-shadow: 0 0 0 2px rgba(199, 0, 25, 0.2);
}

.btn-loading:focus:active:active:active:active:active:active:active:focus:hover {
  background-color: #66b1ff;
}

.btn-loading:focus:active:active:active:active:active:active:active:focus:disabled {
  background-color: #abada9;
  cursor: not-allowed;
}

.btn-loading:focus:active:active:active:active:active:active:active:focus:disabled:hover {
  background-color: #999;
  color: #666;
}

.btn-loading:focus:active:active:active:active:active:active:active:active {
  background-color: #66b1ff;
}

.btn-loading:focus:active:active:active:active:active:active:active:hover {
  background-color: #3399ff;
}

.btn-loading:focus:active:active:active:active:active:active:active:disabled {
  background-color: #abada9;
  cursor: not-allowed;
}

.btn-loading:focus:active:active:active:active:active:active:active:disabled:hover {
  background-color: #999;
  color: #666;
}

.btn-loading:focus:active:active:active:active:active:active:active:focus {
  outline: none;
  box-shadow: 0 0 0 2px rgba(199, 0, 25, 0.2);
}

.btn-loading:focus:active:active:active:active:active:active:active:focus:hover {
  background-color: #66b1ff;
}

.btn-loading:focus:active:active:active:active:active:active:active:focus:disabled {
  background-color: #abada9;
  cursor: not-allowed;
}

.btn-loading:focus:active:active:active:active:active:active:active:focus:disabled:hover {
  background-color: #999;
  color: #666;
}

.btn-loading:focus:active:active:active:active:active:active:active:active {
  background-color: #66b1ff;
}

.btn-loading:focus:active:active:active:active:active:active:active:hover {
  background-color: #3399ff;
}

.btn-loading:focus:active:active:active:active:active:active:active:disabled {
  background-color: #abada9;
  cursor: not-allowed;
}

.btn-loading:focus:active:active:active:active:active:active:active:disabled:hover {
  background-color: #999;
  color: #666;
}

.btn-loading:focus:active:active:active:active:active:active:active:focus {
  outline: none;
  box-shadow: 0 0 0 2px rgba(199, 0, 25, 0.2);
}

.btn-loading:focus:active:active:active:active:active:active:active:focus:hover {
  background-color: #66b1ff;
}

.btn-loading:focus:active:active:active:active:active:active:active:focus:disabled {
  background-color: #abada9;
  cursor: not-allowed;
}
</style>
