export interface MaterialDetailItem {
  id?: string;
  name: string;        // 材料品名
  quantity: number;    // 数量
  unit: string;        // 単位 (個, 組, 缶, 台, 枚, 式, etc.)
  unitPrice?: number;  // 単価
  amount: number;      // 金額 (単価×数量 or 直接入力)
}

export interface LineSubDetail {
  materialName: string; // 代表材料名 (後方互換)
  materialNames?: string[]; // 複数登録可能な材料品名リスト (後方互換)
  materials?: MaterialDetailItem[]; // 複数登録材料リスト (品名・数量・単位・単価・金額・集計対象)
  materialUnitPrice?: number;
  materialQuantity?: number;
  materialUnit?: string;
  materialAmount: number; // 材料費 (materialsの各金額の合計)

  replacementLaborAmount: number; // 取替調整費
  transportAmount: number; // 運搬交通費 (3,000円固定)
  overheadAmount: number; // 諸経費 ((材料費 + 取替調整費) × 0.2)
}

export interface EstimateItem {
  id: string;
  itemNumber: number;
  title: string; // 工事項目
  quantity: number; // 数量
  unit: string; // 単位 (式, 箇所, etc.)
  unitPrice?: number;
  amount: number; // 計 = 材料費 + 取替調整費 + 運搬交通費 + 諸経費

  // The 4-line breakdown details
  breakdown: LineSubDetail;
}

export interface EstimateHeaderData {
  customerName: string;
  dateYear: string;
  dateMonth: string;
  dateDay: string;
  estimateNumber: string;

  referenceDateInfo: string; // e.g. "　年　月　日付　第　号"
  greetingLine1: string; // "ご照会に対し下記のとおりお見積申し上げます、"
  greetingLine2: string; // "何卒ご用命賜りますようお願い申し上げます、"

  deliveryPlace: string;     // "受渡場所: 貴XXXX内"
  deliveryPeriod: string;    // "受渡期間: お打ち合わせの上"
  constructionTerms: string; // "施工条件: 土・日・祝日を除く平日昼間施工"
  validityPeriod: string;    // "見積有効期限: 発行日より3ヶ月"
  paymentTerms: string;      // "お支払い条件: 工事完了後現金でお支払い願います"

  postalCode: string;        // "〒260-0016"
  address1: string;          // "千葉県XX市XXXX 2-3-1"
  address2: string;          // "(XXX千葉ビル内)"
  tel: string;               // "Tel XXX-XXX-XXXX"
  companyName: string;       // "XXXXXXXXXXXX株式会社"
  branchName: string;        // "XXX支店"
  representativeTitle: string; // "代表取締役"
  representativeName: string;  // "XX XX"

  stamp1Title: string;       // "承認"
  stamp2Title: string;       // "審査"
  stamp3Title: string;       // "担当"

  projectCategory: string;   // "本案件内訳"
  projectSubject: string;    // "昇降機設備補修作業"

  taxRate: number; // 0.10
}
