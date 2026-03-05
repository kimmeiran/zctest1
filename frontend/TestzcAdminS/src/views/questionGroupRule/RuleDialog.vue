<template>
    <div v-if="visible" class="overlay" @click.self="onClose">
        <div class="modal">
            <div class="modal__header">
                <div class="modal__title">{{ localForm.id ? '编辑规则' : '新增规则' }}</div>
                <button class="modal__close" @click="onClose" aria-label="关闭">×</button>
            </div>

            <!-- 原型图：第一行 级别 | 类型 | 达标分数 | 默认，同一行、左标签右控件 -->
            <div class="rule-config-row">
                <div class="rule-config-item">
                    <span class="rule-config-label">级别</span>
                    <select v-model="localForm.level" class="rule-config-input">
                        <option v-for="opt in levelOptions" :key="opt.id" :value="opt.name">{{ opt.name }}</option>
                    </select>
                </div>
                <div class="rule-config-item">
                    <span class="rule-config-label">类型 <span class="required">*</span></span>
                    <select v-model.number="localForm.ruleType" class="rule-config-input">
                        <option value="">请选择</option>
                        <option v-if="!isStationAdmin" :value="0">职业认定</option>
                        <option :value="1">竞赛</option>
                        <option :value="2">模拟考核</option>
                    </select>
                </div>
                <div class="rule-config-item">
                    <span class="rule-config-label">达标分数</span>
                    <input type="number" v-model.number="localForm.passScore" class="rule-config-input" placeholder="请输入" />
                </div>
                <div class="rule-config-item rule-config-default">
                    <label class="rule-default-label">
                        <input type="checkbox" v-model="localForm.isDefault" class="rule-default-checkbox" />
                        默认
                    </label>
                </div>
            </div>

            <!-- 竞赛：仅 单选、多选、判断 三列 + 小计，职业道德/基础/专业相关知识 合计须 70%，竞赛合计须 30%，总和 100% -->
            <template v-if="localForm.ruleType === 1">
                <div class="grid grid--5">
                    <div class="grid__label"></div>
                    <div class="grid__th">单选</div>
                    <div class="grid__th">多选</div>
                    <div class="grid__th">判断</div>
                    <div class="grid__th">小计</div>

                    <div class="grid__label">职业道德</div>
                    <input class="input" type="number" v-model.number="localForm.workEthics02" min="0" max="100" @input="handleNumberInput('workEthics02', $event)" @blur="validateNumber('workEthics02')" />
                    <input class="input" type="number" v-model.number="localForm.workEthics03" min="0" max="100" @input="handleNumberInput('workEthics03', $event)" @blur="validateNumber('workEthics03')" />
                    <input class="input" type="number" v-model.number="localForm.workEthics04" min="0" max="100" @input="handleNumberInput('workEthics04', $event)" @blur="validateNumber('workEthics04')" />
                    <div class="grid__sum">{{ rowWorkEthicsSubtotal }}%</div>

                    <div class="grid__label">基础知识</div>
                    <input class="input" type="number" v-model.number="localForm.base02" min="0" max="100" @input="handleNumberInput('base02', $event)" @blur="validateNumber('base02')" />
                    <input class="input" type="number" v-model.number="localForm.base03" min="0" max="100" @input="handleNumberInput('base03', $event)" @blur="validateNumber('base03')" />
                    <input class="input" type="number" v-model.number="localForm.base04" min="0" max="100" @input="handleNumberInput('base04', $event)" @blur="validateNumber('base04')" />
                    <div class="grid__sum">{{ rowBaseSubtotal }}%</div>

                    <div class="grid__label">专业、相关知识</div>
                    <input class="input" type="number" v-model.number="localForm.expert02" min="0" max="100" @input="handleNumberInput('expert02', $event)" @blur="validateNumber('expert02')" />
                    <input class="input" type="number" v-model.number="localForm.expert03" min="0" max="100" @input="handleNumberInput('expert03', $event)" @blur="validateNumber('expert03')" />
                    <input class="input" type="number" v-model.number="localForm.expert04" min="0" max="100" @input="handleNumberInput('expert04', $event)" @blur="validateNumber('expert04')" />
                    <div class="grid__sum">{{ rowExpertSubtotal }}%</div>

                    <div class="grid__label grid__label--sub">非竞赛合计</div>
                    <div class="grid__sum"></div>
                    <div class="grid__sum"></div>
                    <div class="grid__sum"></div>
                    <div class="grid__sum" :class="{ 'sum-all--error': !isGroupNonCompetitionValid }">{{ groupNonCompetitionTotal }}% <span v-if="!isGroupNonCompetitionValid" class="sum-all__hint">（须=70%）</span></div>

                    <div class="grid__label">竞赛</div>
                    <input class="input" type="number" v-model.number="localForm.competition02" min="0" max="100" @input="handleNumberInput('competition02', $event)" @blur="validateNumber('competition02')" />
                    <input class="input" type="number" v-model.number="localForm.competition03" min="0" max="100" @input="handleNumberInput('competition03', $event)" @blur="validateNumber('competition03')" />
                    <input class="input" type="number" v-model.number="localForm.competition04" min="0" max="100" @input="handleNumberInput('competition04', $event)" @blur="validateNumber('competition04')" />
                    <div class="grid__sum">{{ rowCompetitionSubtotal }}%</div>

                    <div class="grid__label grid__label--sub">竞赛合计</div>
                    <div class="grid__sum"></div>
                    <div class="grid__sum"></div>
                    <div class="grid__sum"></div>
                    <div class="grid__sum" :class="{ 'sum-all--error': !isGroupCompetitionValid }">{{ groupCompetitionTotal }}% <span v-if="!isGroupCompetitionValid" class="sum-all__hint">（须=30%）</span></div>
                </div>
                <div class="grid__label sum-all" :class="{ 'sum-all--error': !isTotalValid, 'sum-all--success': isTotalValid }">
                    总和：<span class="sum-all__num">{{ totalAll }}%</span>
                    <span v-if="!isTotalValid" class="sum-all__hint">（必须等于 100%）</span>
                    <span v-else class="sum-all__hint sum-all__hint--success">✓</span>
                </div>
            </template>

            <!-- 非竞赛：原有 6 列 填空/单选/多选/判断/简答/综合 -->
            <template v-else>
                <div class="grid grid--6">
                    <div class="grid__label"></div>
                    <div class="grid__th">填空</div>
                    <div class="grid__th">单选</div>
                    <div class="grid__th">多选</div>
                    <div class="grid__th">判断</div>
                    <div class="grid__th">简答</div>
                    <div class="grid__th">综合</div>

                    <div class="grid__label">职业道德</div>
                    <input class="input" type="number" v-model.number="localForm.workEthics01" min="0" max="100" @input="handleNumberInput('workEthics01', $event)" @blur="validateNumber('workEthics01')" />
                    <input class="input" type="number" v-model.number="localForm.workEthics02" min="0" max="100" @input="handleNumberInput('workEthics02', $event)" @blur="validateNumber('workEthics02')" />
                    <input class="input" type="number" v-model.number="localForm.workEthics03" min="0" max="100" @input="handleNumberInput('workEthics03', $event)" @blur="validateNumber('workEthics03')" />
                    <input class="input" type="number" v-model.number="localForm.workEthics04" min="0" max="100" @input="handleNumberInput('workEthics04', $event)" @blur="validateNumber('workEthics04')" />
                    <div class="grid__placeholder"></div>
                    <div class="grid__placeholder"></div>

                    <div class="grid__label">基础知识</div>
                    <input class="input" type="number" v-model.number="localForm.base01" min="0" max="100" @input="handleNumberInput('base01', $event)" @blur="validateNumber('base01')" />
                    <input class="input" type="number" v-model.number="localForm.base02" min="0" max="100" @input="handleNumberInput('base02', $event)" @blur="validateNumber('base02')" />
                    <input class="input" type="number" v-model.number="localForm.base03" min="0" max="100" @input="handleNumberInput('base03', $event)" @blur="validateNumber('base03')" />
                    <input class="input" type="number" v-model.number="localForm.base04" min="0" max="100" @input="handleNumberInput('base04', $event)" @blur="validateNumber('base04')" />
                    <div class="grid__placeholder"></div>
                    <div class="grid__placeholder"></div>
                </div>

                <div class="grid grid--6">
                    <div class="grid__label">专业、相关知识</div>
                    <input class="input" type="number" v-model.number="localForm.expert01" min="0" max="100" @input="handleNumberInput('expert01', $event)" @blur="validateNumber('expert01')" />
                    <input class="input" type="number" v-model.number="localForm.expert02" min="0" max="100" @input="handleNumberInput('expert02', $event)" @blur="validateNumber('expert02')" />
                    <input class="input" type="number" v-model.number="localForm.expert03" min="0" max="100" @input="handleNumberInput('expert03', $event)" @blur="validateNumber('expert03')" />
                    <input class="input" type="number" v-model.number="localForm.expert04" min="0" max="100" @input="handleNumberInput('expert04', $event)" @blur="validateNumber('expert04')" />
                    <input class="input" type="number" v-model.number="localForm.expert05" min="0" max="100" @input="handleNumberInput('expert05', $event)" @blur="validateNumber('expert05')" />
                    <input class="input" type="number" v-model.number="localForm.expert06" min="0" max="100" @input="handleNumberInput('expert06', $event)" @blur="validateNumber('expert06')" />
                </div>

                <div class="grid grid--6 grid--sum">
                    <div class="grid__label">合计</div>
                    <div class="grid__sum">{{ totalFillIn }}%</div>
                    <div class="grid__sum">{{ totalSingleChoice }}%</div>
                    <div class="grid__sum">{{ totalMultipleChoice }}%</div>
                    <div class="grid__sum">{{ totalJudge }}%</div>
                    <div class="grid__sum">{{ totalShortAnswer }}%</div>
                    <div class="grid__sum">{{ totalComprehensive }}%</div>
                </div>
                <div class="grid__label" :class="{ 'sum-all--error': !isTotalValid, 'sum-all--success': isTotalValid }">
                    总和：<span class="sum-all__num">{{ totalAll }}%</span>
                    <span v-if="!isTotalValid" class="sum-all__hint">（必须等于 100%）</span>
                    <span v-else class="sum-all__hint sum-all__hint--success">✓</span>
                </div>
            </template>
            
            <div class="form-row">
                <div class="form-row__label">备注</div>
                <div class="form-row__content">
                    <textarea v-model="localForm.remark" class="input textarea-input" placeholder="请输入备注信息" rows="3"></textarea>
                </div>
            </div>

            <!-- <div class="grid grid--4">
                <div class="grid__label"></div>
                <div class="grid__th">基础</div>
                <div class="grid__th">专业</div>
                <div class="grid__th">简答</div>
                <div class="grid__th">综合</div>

                <div class="grid__label">难易度范围</div>
                <input class="input" v-model="localForm.baseEd" placeholder="如 1,2,3" />
                <input class="input" v-model="localForm.expertEd" placeholder="如 1,2,3" />
                <input class="input" v-model="localForm.fiveEd" placeholder="如 1,2" />
                <input class="input" v-model="localForm.sixEd" placeholder="如 1,2" />
            </div> -->

            <div class="modal__footer">
                <button class="btn" @click="onClose">取消</button>
                <button class="btn btn--primary" @click="onSave">保存</button>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { reactive, watch, computed, ref, onMounted } from 'vue'
import { getDictionaryByType } from '@/api/user'
import { ROLE_EXAM_STATION_ADMIN, toRoleNumber } from '@/constants/role'

interface RuleItem {
    id?: number
    level: string
    ruleType?: number | string  // 0=职业认定 1=竞赛 2=模拟考核
    passScore?: number
    isDefault?: boolean
    workEthics01?: number
    workEthics02?: number
    workEthics03?: number
    workEthics04?: number
    base01?: number
    base02?: number
    base03?: number
    base04?: number
    expert01?: number
    expert02?: number
    expert03?: number
    expert04?: number
    expert05?: number
    expert06?: number
    competition01?: number
    competition02?: number
    competition03?: number
    competition04?: number
    competition05?: number
    competition06?: number
    baseEd?: string
    expertEd?: string
    fiveEd?: string
    sixEd?: string
    remark?: string
}

const props = defineProps<{ visible: boolean; form: RuleItem }>()
const emit = defineEmits<{ (e: 'close'): void; (e: 'submit', form: RuleItem): void }>()

const isStationAdmin = computed(() => {
    try {
        const userStr = sessionStorage.getItem('user')
        const user = userStr ? JSON.parse(userStr) : {}
        return toRoleNumber(user?.role) === ROLE_EXAM_STATION_ADMIN
    } catch { return false }
})

const localForm = reactive<RuleItem>({ level: '初级' })

const levelOptions = ref<Array<{ id: number; name: string; code?: string }>>([])

const fetchLevelOptions = async () => {
    try {
        const response = await getDictionaryByType({ type: 1 })
        if (response && response.code === 200 && response.data) {
            levelOptions.value = response.data.map((item: any) => ({ id: item.id, name: item.name, code: item.code }))
            // 若当前level不在字典中，则兜底为第一个
            const names = levelOptions.value.map(i => i.name)
            if (!names.includes(localForm.level) && levelOptions.value.length > 0) {
                localForm.level = levelOptions.value[0].name
            }
        }
    } catch (e) {
        // 保持静默失败，避免阻塞弹窗使用
    }
}

const normalizeLevel = (value: unknown): string => {
    if (value === undefined || value === null) return '初级工'
    const s = String(value).trim()
    // 数字到标准名称（与字典一致）
    const numToName: Record<string, string> = {
        '1': '初级工',
        '2': '中级工',
        '3': '高级工',
        '4': '技师',
        '5': '高级技师'
    }
    if (numToName[s]) return numToName[s]
    // 兼容0-4到1-5
    if (/^[0-4]$/.test(s)) return numToName[String(Number(s) + 1)] || '初级工'
    // 中文别名到标准名称
    const aliasToName: Record<string, string> = {
        '初级': '初级工',
        '初级工': '初级工',
        '中级': '中级工',
        '中级工': '中级工',
        '高级': '高级工',
        '高级工': '高级工',
        '技师': '技师',
        '高级技师': '高级技师'
    }
    if (aliasToName[s]) return aliasToName[s]
    // 最后尝试与字典匹配（包含关系）
    const names = levelOptions.value?.map(i => i.name) || []
    const found = names.find(n => n === s || s.includes(n) || n.includes(s))
    if (found) return found
    return '初级工'
}

watch(
    () => props.form,
    (val) => {
        const next: any = { ...(val || {}) }
        next.level = normalizeLevel(next.level)
        // ruleType: 0=职业认定 1=竞赛 2=模拟考核，兼容后端返回字符串
        const rt = next.ruleType
        if (rt === '职业认定' || rt === 'CAREER_CERTIFICATION') next.ruleType = 0
        else if (rt === '竞赛' || rt === 'COMPETITION') next.ruleType = 1
        else if (rt === '模拟考核' || rt === '模拟考试' || rt === 'MOCK_EXAM') next.ruleType = 2
        // 通过分数字段统一为 passScore，兼容后端返回 passingScore
        next.passScore = next.passScore ?? next.passingScore
        Object.assign(localForm, { level: '初级', ...next })
        // 考核站管理员不能选职业认定，若为 0 则强制为竞赛
        if (isStationAdmin.value && (next.ruleType === 0 || next.ruleType === '0')) {
            localForm.ruleType = 1
        }
    },
    { deep: true, immediate: true }
)

onMounted(() => {
    fetchLevelOptions()
})

watch(
    () => props.visible,
    async (open) => {
        if (open) {
            // 每次弹窗打开时同步一次级别并确保选项可用
            const normalized = normalizeLevel((props.form as any)?.level)
            localForm.level = normalized
            if (!levelOptions.value || levelOptions.value.length === 0) {
                await fetchLevelOptions()
            }
            const names = (levelOptions.value || []).map(i => i.name)
            if (names.length > 0 && !names.includes(localForm.level)) {
                localForm.level = levelOptions.value[0].name
            }
            // 考核站管理员不能选职业认定，打开时若为 0 则强制为竞赛
            if (isStationAdmin.value && (localForm.ruleType === 0 || localForm.ruleType === '0')) {
                localForm.ruleType = 1
            }
        }
    }
)

const onClose = () => emit('close')

// 处理数字输入，禁止负数
const handleNumberInput = (field: string, event: Event) => {
    const target = event.target as HTMLInputElement
    let value = target.value
    
    // 移除负号
    if (value.startsWith('-')) {
        value = value.replace('-', '')
    }
    
    // 转换为数字
    const numValue = Number(value)
    
    // 如果为空或NaN，设为undefined（允许清空）
    if (value === '' || isNaN(numValue)) {
        (localForm as any)[field] = undefined
        return
    }
    
    // 限制范围：0-100
    if (numValue < 0) {
        (localForm as any)[field] = 0
    } else if (numValue > 100) {
        (localForm as any)[field] = 100
    } else {
        (localForm as any)[field] = numValue
    }
}

// 校验数字合理性
const validateNumber = (field: string) => {
    const value = (localForm as any)[field]
    if (value !== undefined && value !== null) {
        const numValue = Number(value)
        if (isNaN(numValue) || numValue < 0) {
            (localForm as any)[field] = undefined
        } else if (numValue > 100) {
            (localForm as any)[field] = 100
        }
    }
}

// 校验总和是否等于100%
const isTotalValid = computed(() => {
    const EPSILON = 0.0001
    return Math.abs(totalAll.value - 100) < EPSILON
})

const onSave = () => {
    // ruleType 有效值为 0/1/2，0 为职业认定（不能用 !localForm.ruleType 判断，0 为 falsy）
    const rt = Number(localForm.ruleType)
    if (Number.isNaN(rt) || rt < 0 || rt > 2) {
        window.alert('请选择规则类型')
        return
    }
    
    // 竞赛：校验 非竞赛合计=70%、竞赛合计=30%、总和=100%
    if (rt === 1) {
        if (!isGroupNonCompetitionValid.value) {
            window.alert(`职业道德、基础知识、专业相关知识合计必须等于 70%，当前为 ${groupNonCompetitionTotal.value.toFixed(2)}%`)
            return
        }
        if (!isGroupCompetitionValid.value) {
            window.alert(`竞赛合计必须等于 30%，当前为 ${groupCompetitionTotal.value.toFixed(2)}%`)
            return
        }
    }

    // 校验总和
    if (!isTotalValid.value) {
        const diff = Math.abs(totalAll.value - 100)
        window.alert(`各题型比例总和必须等于 100%，当前为 ${totalAll.value.toFixed(2)}%，相差 ${diff.toFixed(2)}%`)
        return
    }
    
    // 校验是否有负数（双重保险）
    const allFields = [
        'workEthics01', 'workEthics02', 'workEthics03', 'workEthics04',
        'base01', 'base02', 'base03', 'base04',
        'expert01', 'expert02', 'expert03', 'expert04', 'expert05', 'expert06',
        'competition01', 'competition02', 'competition03', 'competition04', 'competition05', 'competition06'
    ]
    for (const field of allFields) {
        const value = (localForm as any)[field]
        if (value !== undefined && value !== null && Number(value) < 0) {
            window.alert('比例值不能为负数，请检查输入')
            return
        }
    }
    
    emit('submit', { ...localForm })
}

// 计算各题型合计
const toNumber = (v: unknown): number => {
    const n = Number(v)
    return Number.isFinite(n) ? n : 0
}

const EPSILON = 0.0001

// 竞赛模式：仅 单选(02)、多选(03)、判断(04)
const rowWorkEthicsSubtotal = computed(() =>
    toNumber(localForm.workEthics02) + toNumber(localForm.workEthics03) + toNumber(localForm.workEthics04)
)
const rowBaseSubtotal = computed(() =>
    toNumber(localForm.base02) + toNumber(localForm.base03) + toNumber(localForm.base04)
)
const rowExpertSubtotal = computed(() =>
    toNumber(localForm.expert02) + toNumber(localForm.expert03) + toNumber(localForm.expert04)
)
const rowCompetitionSubtotal = computed(() =>
    toNumber(localForm.competition02) + toNumber(localForm.competition03) + toNumber(localForm.competition04)
)
const groupNonCompetitionTotal = computed(() =>
    rowWorkEthicsSubtotal.value + rowBaseSubtotal.value + rowExpertSubtotal.value
)
const groupCompetitionTotal = computed(() => rowCompetitionSubtotal.value)
const isGroupNonCompetitionValid = computed(() =>
    Math.abs(groupNonCompetitionTotal.value - 70) < EPSILON
)
const isGroupCompetitionValid = computed(() =>
    Math.abs(groupCompetitionTotal.value - 30) < EPSILON
)

const totalFillIn = computed(() =>
    toNumber(localForm.workEthics01) + toNumber(localForm.base01) + toNumber(localForm.expert01) +
    (localForm.ruleType === 1 ? toNumber(localForm.competition01) : 0)
)
const totalSingleChoice = computed(() =>
    toNumber(localForm.workEthics02) + toNumber(localForm.base02) + toNumber(localForm.expert02) +
    (localForm.ruleType === 1 ? toNumber(localForm.competition02) : 0)
)
const totalMultipleChoice = computed(() =>
    toNumber(localForm.workEthics03) + toNumber(localForm.base03) + toNumber(localForm.expert03) +
    (localForm.ruleType === 1 ? toNumber(localForm.competition03) : 0)
)
const totalJudge = computed(() =>
    toNumber(localForm.workEthics04) + toNumber(localForm.base04) + toNumber(localForm.expert04) +
    (localForm.ruleType === 1 ? toNumber(localForm.competition04) : 0)
)
const totalShortAnswer = computed(() =>
    toNumber(localForm.expert05) + (localForm.ruleType === 1 ? toNumber(localForm.competition05) : 0)
)
const totalComprehensive = computed(() =>
    toNumber(localForm.expert06) + (localForm.ruleType === 1 ? toNumber(localForm.competition06) : 0)
)
const totalAll = computed(() => {
    if (localForm.ruleType === 1) {
        return groupNonCompetitionTotal.value + groupCompetitionTotal.value
    }
    let sum =
        toNumber(localForm.workEthics01) + toNumber(localForm.workEthics02) + toNumber(localForm.workEthics03) + toNumber(localForm.workEthics04) +
        toNumber(localForm.base01) + toNumber(localForm.base02) + toNumber(localForm.base03) + toNumber(localForm.base04) +
        toNumber(localForm.expert01) + toNumber(localForm.expert02) + toNumber(localForm.expert03) + toNumber(localForm.expert04) +
        toNumber(localForm.expert05) + toNumber(localForm.expert06)
    if (localForm.ruleType === 1) {
        sum += toNumber(localForm.competition01) + toNumber(localForm.competition02) + toNumber(localForm.competition03) +
            toNumber(localForm.competition04) + toNumber(localForm.competition05) + toNumber(localForm.competition06)
    }
    return sum
})
</script>

<style scoped>
.overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, .3);
    backdrop-filter: blur(2px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
}

.modal {
    width: 900px;
    max-width: 95vw;
    background: #fff;
    border-radius: 4px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, .15);
    border: 1px solid #e8e8e8;
    padding: 0 24px 20px;
}

.modal__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    border-bottom: 1px solid #f0f0f0;
    padding: 16px 0;
    margin-bottom: 0;
}

.modal__title {
    font-size: 16px;
    font-weight: 600;
    color: #333;
}

.modal__close {
    width: 32px;
    height: 32px;
    border: 1px solid #d9d9d9;
    border-radius: 4px;
    background: #fff;
    cursor: pointer;
    line-height: 30px;
    font-size: 18px;
    color: #666;
    padding: 0;
}

.modal__close:hover {
    background: #f5f5f5;
    color: #333;
}

.form-row {
    display: grid;
    grid-template-columns: 120px 1fr;
    align-items: center;
    gap: 8px;
    padding: 8px 0;
}

.form-row__label .required {
    color: #ff4d4f;
}

.form-row__label {
    text-align: left;
    color: #606266;
    padding: 0;
    background: transparent;
    border: none;
    border-radius: 0;
    font-weight: 600;
    white-space: nowrap;
}

.form-row__content {
    display: flex;
    gap: 8px;
}

/* 原型图顶部：级别 | 类型 | 达标分数 | 默认 同一行 */
.rule-config-row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 24px 32px;
    padding: 12px 0 16px;
    margin-bottom: 4px;
}

.rule-config-item {
    display: flex;
    align-items: center;
    gap: 8px;
}

.rule-config-label {
    color: #606266;
    font-size: 14px;
    font-weight: 500;
    white-space: nowrap;
}

.rule-config-label .required {
    color: #ff4d4f;
}

.rule-config-input {
    width: 140px;
    min-width: 100px;
    height: 32px;
    padding: 4px 11px;
    border: 1px solid #d9d9d9;
    border-radius: 4px;
    font-size: 14px;
    outline: none;
}

.rule-config-input:focus {
    border-color: #1890ff;
}

.rule-config-default {
    margin-left: 0;
}

.rule-default-label {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    cursor: pointer;
    font-size: 14px;
    color: #606266;
    font-weight: normal;
}

.rule-default-checkbox {
    width: 14px;
    height: 14px;
    cursor: pointer;
}

.grid {
    display: grid;
    gap: 8px;
    align-items: center;
    padding: 6px 0;
}

.grid--4 {
    grid-template-columns: 120px repeat(4, 1fr);
}

.grid--5 {
    grid-template-columns: 120px repeat(3, 1fr) 110px;
}

.grid--6 {
    grid-template-columns: 120px repeat(6, 1fr);
}

.grid__label {
    text-align: left;
    color: #606266;
    padding: 20px 0px 10px 0px;
    background: transparent;
    border: none;
    border-radius: 0;
    font-weight: 600;
    white-space: nowrap;
}

.grid__th {
    color: #8c8c8c;
    font-size: 12px;
    text-align: center;
}

.grid__placeholder {
    visibility: hidden;
}

.grid__label--sub {
    padding-left: 16px;
    color: #8c8c8c;
    font-weight: 500;
}

.grid--sum {
    border-top: 1px solid #eee;
    margin-top: 6px;
    padding-top: 10px;
}

.grid__sum {
    text-align: center;
    font-weight: 600;
    color: #1f2329;
}

.grid__sum.sum-all--error {
    color: #ff4d4f;
}

.grid__sum .sum-all__hint {
    white-space: nowrap;
}

.sum-all {
    display: flex;
    align-items: center;
    justify-content: flex-start;
    padding-top: 6px;
    color: #606266;
}

.sum-all__num {
    font-weight: 600;
    color: #1f2329;
    margin-left: 4px;
}

.sum-all--error .sum-all__num {
    color: #ff4d4f;
}

.sum-all--success .sum-all__num {
    color: #52c41a;
}

.sum-all__hint {
    margin-left: 8px;
    font-size: 12px;
    color: #ff4d4f;
}

.sum-all__hint--success {
    color: #52c41a;
    font-weight: 600;
}

.input {
    border: 1px solid #d9d9d9;
    border-radius: 4px;
    padding: 6px 11px;
    height: 32px;
    outline: none;
    width: 100%;
    font-size: 14px;
}

.level-input {
    width: 260px;
}

.input:focus {
    border-color: #1890ff;
}

.textarea-input {
    min-height: 80px;
    resize: vertical;
    font-family: inherit;
    border: 1px solid #d9d9d9;
    border-radius: 4px;
    padding: 6px 11px;
    font-size: 14px;
}

/* 备注：原型图 左标签右输入 */
.form-row {
    padding: 10px 0;
}

.modal__footer {
    text-align: right;
    padding-top: 16px;
    border-top: 1px solid #f0f0f0;
    margin-top: 8px;
}

.btn {
    padding: 6px 16px;
    height: 32px;
    border: 1px solid #d9d9d9;
    background: #fff;
    border-radius: 4px;
    cursor: pointer;
    margin-left: 8px;
    font-size: 14px;
}

.btn:first-of-type {
    margin-left: 0;
}

.btn--primary {
    background: #1890ff;
    color: #fff;
    border-color: #1890ff;
}

.btn--primary:hover {
    background: #40a9ff;
    border-color: #40a9ff;
}
</style>
