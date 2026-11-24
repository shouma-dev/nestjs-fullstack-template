export type Page = { id: string; title: string; brand: string; source: string; url: string };
export type Ledger = {
  search: string;
  columns: string[];
  rows: string[][];
  object?: string;
  facet?: { label: string; column: number };
  related?: Record<string, [route: string, label: string][]>;
};

export const templateGroups: { label: string; pages: Page[] }[] = [
  {
    label: '经营总览', pages: [
      { id: 'analysis', title: '经营分析', brand: '澄川经营台', source: 'Ant Design Pro', url: 'https://preview.pro.ant.design/dashboard/analysis/' },
    ],
  },
  {
    label: '采购与库存', pages: [
      { id: 'purchase', title: '采购订单', brand: '采购管理', source: '芋道 ERP', url: 'https://doc.iocoder.cn/erp/purchase/' },
      { id: 'inbound', title: '采购入库', brand: '采购管理', source: '芋道 ERP', url: 'https://doc.iocoder.cn/erp/purchase/' },
      { id: 'returns', title: '采购退货', brand: '采购管理', source: '芋道 ERP', url: 'https://doc.iocoder.cn/erp/purchase/' },
      { id: 'receipt', title: '收货单', brand: '仓储工作台', source: 'ERPNext', url: 'https://docs.frappe.io/erpnext/purchase-receipt' },
    ],
  },
  {
    label: '审批与管理', pages: [
      { id: 'review', title: '运费审核', brand: '运费审核台', source: 'SAP Fiori', url: 'https://github.com/SAP-samples/fiori-elements-feature-showcase/blob/ecbb43c7a152a57e454758675d100129375c5855/README.md#flexible-column-layout' },
      { id: 'people', title: '组织人员', brand: '组织管理', source: 'RuoYi-Vue3', url: 'https://github.com/yangzongzhuan/RuoYi-Vue3/blob/465b3ed4c2ab270f041eabd466145f7e8449fd41/src/views/system/user/index.vue' },
      { id: 'contracts', title: '合同台账', brand: '合同管理', source: 'TDesign Starter', url: 'https://tdesign.tencent.com/starter/vue-next/list/base' },
      { id: 'content', title: '内容查询', brand: '内容运营', source: 'Arco Design Pro', url: 'https://github.com/arco-design/arco-design-pro-vue/blob/27020819af653243b7b1a3e8e2481d6b3d798749/arco-design-pro-vite/src/views/list/search-table/index.vue' },
    ],
  },
  {
    label: '列表与表单', pages: [
      { id: 'requests', title: '费用申请列表', brand: '澄川经营台', source: 'Ant Design Pro', url: 'https://preview.pro.ant.design/list/table-list/' },
      { id: 'advanced', title: '高级表单', brand: '澄川经营台', source: 'Ant Design Pro', url: 'https://preview.pro.ant.design/form/advanced-form/' },
      { id: 'steps', title: '分步表单', brand: '澄川经营台', source: 'Ant Design Pro', url: 'https://preview.pro.ant.design/form/step-form/' },
    ],
  },
];

export const inventory: Record<string, Ledger> = {
  purchase: {
    object: '采购订单', search: '采购单号或供应商', columns: ['采购单号', '供应商', '交货仓库', '预计到货', '含税金额 / 元', '状态'],
    rows: [
      ['PO-23084', '苏州凯程工业配件', '昆山中心仓', '2026-11-18', '18,460.00', '部分收货'],
      ['PO-23081', '无锡铂锐工控', '昆山中心仓', '2026-11-20', '32,780.00', '待收货'],
      ['PO-23079', '宁波海洲包装', '杭州周转仓', '2026-11-19', '9,360.00', '已完成'],
      ['PO-23073', '常州禾信精密', '昆山中心仓', '2026-11-22', '26,550.00', '待审核'],
      ['PO-23069', '苏州凯程工业配件', '南京备件仓', '2026-11-16', '12,400.00', '已完成'],
      ['PO-23062', '上海明渡仪器', '杭州周转仓', '2026-11-17', '7,880.00', '部分收货'],
      ['PO-23057', '嘉兴嘉辰材料', '南京备件仓', '2026-11-25', '21,600.00', '待收货'],
      ['PO-23041', '南通众联劳保', '昆山中心仓', '2026-11-11', '6,472.00', '已完成'],
    ],
    related: { 'PO-23084': [['inbound', 'GR-0816'], ['returns', 'RT-0028']] },
  },
  inbound: {
    object: '采购入库', search: '入库单号或采购单号', columns: ['入库单号', '采购订单', '供应商', '入库仓库', '合格数量', '状态'],
    rows: [
      ['GR-0816', 'PO-23084', '苏州凯程工业配件', '昆山中心仓', '132 件', '已入库'],
      ['GR-0815', 'PO-23079', '宁波海洲包装', '杭州周转仓', '240 件', '已入库'],
      ['GR-0812', 'PO-23081', '无锡铂锐工控', '昆山中心仓', '0 件', '待审核'],
      ['GR-0808', 'PO-23069', '苏州凯程工业配件', '南京备件仓', '100 件', '已入库'],
      ['GR-0805', 'PO-23062', '上海明渡仪器', '杭州周转仓', '24 件', '已入库'],
      ['GR-0799', 'PO-23057', '嘉兴嘉辰材料', '南京备件仓', '0 件', '草稿'],
      ['GR-0792', 'PO-23041', '南通众联劳保', '昆山中心仓', '160 件', '已入库'],
    ],
    related: { 'GR-0816': [['purchase', 'PO-23084'], ['receipt', '收货明细'], ['returns', 'RT-0028']] },
  },
  returns: {
    object: '采购退货', search: '退货单号、入库单号或供应商', columns: ['退货单号', '来源入库单', '供应商', '退货原因', '退货数量', '状态'],
    rows: [
      ['RT-0028', 'GR-0816', '苏州凯程工业配件', '到货包装破损', '4 件', '待审核'],
      ['RT-0026', 'GR-0810', '南京鸿卓物料', '规格与订单不符', '12 件', '已退货'],
      ['RT-0025', 'GR-0797', '上海立衡工业', '检测未通过', '6 件', '已退货'],
      ['RT-0021', 'GR-0780', '盐城今岳制造', '外箱受潮', '8 件', '草稿'],
    ],
    related: { 'RT-0028': [['inbound', 'GR-0816'], ['purchase', 'PO-23084']] },
  },
};

export const ledgers: Record<string, Ledger> = {
  contracts: {
    search: '搜索合同编号、名称或对方单位', columns: ['合同编号', '合同名称', '对方单位', '收付方向', '待结算 / 元', '到期日', '状态'],
    rows: [
      ['CT-2026-318', '华东区冷库年度维保', '澄江物流', '应收', '36,000.00', '2026-11-16', '逾期'],
      ['CT-2026-312', '园区仓房短租补充协议', '澄江物流', '应付', '8,400.00', '2026-11-26', '执行中'],
      ['CT-2026-308', '运输车辆轮胎采购', '海门供应链', '应付', '12,600.00', '2026-12-03', '待审核'],
      ['CT-2026-296', '冬季恒温运输服务', '白塔食品', '应收', '78,200.00', '2026-12-15', '执行中'],
      ['CT-2026-282', '仓储扫码设备采购', '上海闻桥科技', '应付', '18,460.00', '2026-12-21', '待执行'],
      ['CT-2026-275', '质检仪器年检服务', '南岸计量站', '应付', '0.00', '2026-11-10', '已结清'],
      ['CT-2026-242', '零担配送框架协议', '新丰零售', '应收', '41,700.00', '2026-12-30', '执行中'],
      ['CT-2026-226', '托盘租赁续签', '康桥物流', '应付', '0.00', '2026-10-31', '已结清'],
      ['CT-2026-199', '城西门店配送服务', '安吉贸易', '应收', '16,900.00', '2026-11-12', '逾期'],
    ],
    facet: { label: '收付方向', column: 3 },
  },
  content: {
    search: '搜索内容编号、名称', columns: ['内容编号', '内容名称', '内容类型', '分发方式', '创建时间', '状态'],
    rows: [
      ['OPS-4158', '十一月会员日活动页', '图文', '人工分发', '2026-11-19 10:36', '已上线'],
      ['OPS-4156', '华东地区冬季到家服务', '图文', '规则分发', '2026-11-19 10:11', '审核中'],
      ['OPS-4149', '商家入驻服务说明', '视频', '人工分发', '2026-11-18 16:08', '已下线'],
      ['OPS-4143', '新客首购权益指南', '图文', '规则分发', '2026-11-18 15:20', '已上线'],
      ['OPS-4136', '商圈配送时效提示', '纯文本', '规则分发', '2026-11-18 11:05', '草稿'],
      ['OPS-4130', '社区门店食安检查说明', '视频', '人工分发', '2026-11-17 17:40', '审核中'],
      ['OPS-4120', '周末配送调整通知', '纯文本', '人工分发', '2026-11-16 15:21', '已上线'],
      ['OPS-4102', '会员积分兑换活动', '图文', '规则分发', '2026-11-15 10:09', '已下线'],
    ],
    facet: { label: '内容类型', column: 2 },
  },
  people: {
    search: '搜索姓名或工号', columns: ['工号', '姓名', '部门', '岗位', '入职日期', '状态'],
    rows: [
      ['S-0031', '陈禾', '苏州仓', '收货组长', '2021-04-12', '在职'],
      ['S-0084', '岳宁', '苏州仓', '仓库管理员', '2022-08-10', '在职'],
      ['S-0112', '吴帆', '苏州仓', '盘点员', '2026-11-24', '待入职'],
      ['S-0108', '潘文予', '苏州仓', '现场协调员', '2025-03-07', '在职'],
      ['S-0052', '严青', '苏州仓', '质检专员', '2021-11-12', '在职'],
      ['S-0110', '周清', '苏州仓', '拣货员', '2025-10-27', '在职'],
      ['J-0017', '陈禾', '嘉兴仓', '配送班组长', '2020-06-18', '在职'],
      ['J-0073', '成伊', '嘉兴仓', '库管员', '2023-02-01', '在职'],
      ['N-0086', '徐明', '广州仓', '库存主管', '2023-09-01', '在职'],
      ['F-0033', '蔡蓉', '财务部', '应付会计', '2022-05-06', '在职'],
    ],
    facet: { label: '部门', column: 2 },
  },
  requests: {
    search: '申请单号或事由', columns: ['申请单号', '申请事由', '申请人', '费用类别', '金额 / 元', '申请日期', '状态'],
    rows: [
      ['EX-26081', '昆山仓盘点临时用工', '陆昕', '用工', '4,200.00', '2026-11-18', '待审核'],
      ['EX-26078', '华南供应商年度对账差旅', '关溪', '差旅', '2,364.50', '2026-11-17', '待审核'],
      ['EX-26071', '双十一临时干线调拨', '朱蕴', '运输', '16,900.00', '2026-11-14', '已通过'],
      ['EX-26065', '苏州仓叉车保养', '陈禾', '设备', '1,220.00', '2026-11-11', '已通过'],
      ['EX-26059', '办公用品补充采购', '于红', '办公', '886.00', '2026-11-08', '草稿'],
      ['EX-26054', '门店培训活动物料', '钱航', '办公', '3,300.00', '2026-11-06', '已退回'],
      ['EX-26048', '冷链仓临时运力补充', '何川', '运输', '18,440.00', '2026-11-04', '已通过'],
    ],
    facet: { label: '费用类别', column: 3 },
  },
};

export const freight = [
  { id: 'FR-24091', name: '云桥运输', route: '昆山仓 → 城西店', issue: '账单加收等待费', expected: 1240, billed: 1420, waybill: 'WB-2307', bill: 'YQ-1118-07' },
  { id: 'FR-24087', name: '港城联运', route: '杭州仓 → 滨江店', issue: '缺签收凭据', expected: 980, billed: 980, waybill: 'WB-2284', bill: 'GC-1118-12' },
  { id: 'FR-24085', name: '远岸运输', route: '南京仓 → 江北店', issue: '疑似重复计费', expected: 1680, billed: 3360, waybill: 'WB-2261', bill: 'YA-1118-09' },
  { id: 'FR-24083', name: '华宁冷链', route: '昆山仓 → 城南店', issue: '冷链附加费不符', expected: 2600, billed: 2750, waybill: 'WB-2259', bill: 'HN-1118-08' },
];

export const catalog = templateGroups.flatMap(group => group.pages);
