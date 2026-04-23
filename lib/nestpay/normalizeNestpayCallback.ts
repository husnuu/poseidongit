/**
 * Payten / NestPay 3D Pay Hosting — callback POST alanlarını büyük/küçük harf duyarsız okuyup
 * tek tip bir nesneye indirger (değerler trimlenir).
 */

function pickInsensitive(record: Record<string, string>, canonical: string): string {
  const t = canonical.toLowerCase()
  for (const [k, v] of Object.entries(record)) {
    if (k.toLowerCase() === t) return typeof v === 'string' ? v.trim() : ''
  }
  return ''
}

/** Dokümanda geçen işlem yanıtı + MPI alanları (callback’te beklenen üst küme). */
export type NestpayCallbackNormalized = {
  Response: string
  ProcReturnCode: string
  mdStatus: string
  oid: string
  ReturnOid: string
  AuthCode: string
  HostRefNum: string
  TransId: string
  ErrMsg: string
  HASH: string
  ClientIp: string
  MaskedPan: string
  rnd: string
  'EXTRA.TRXDATE': string
  merchantID: string
  txstatus: string
  iReqCode: string
  iReqDetail: string
  vendorCode: string
  PAResSyntaxOK: string
  ParesVerified: string
  eci: string
  cavv: string
  xid: string
  cavvAlgorithm: string
  md: string
  Version: string
  sID: string
  MdErrorMsg: string
}

function pickExtraTrxDate(record: Record<string, string>): string {
  const dot = pickInsensitive(record, 'EXTRA.TRXDATE')
  if (dot) return dot
  return pickInsensitive(record, 'EXTRA_TRXDATE')
}

/**
 * Ham POST kaydından (orijinal anahtar adları korunabilir) normalize edilmiş alanlar.
 * Eksik alanlar boş string olur.
 */
export function normalizeCaseInsensitivePaymentFields(
  record: Record<string, string>
): NestpayCallbackNormalized {
  return {
    Response: pickInsensitive(record, 'Response'),
    ProcReturnCode: pickInsensitive(record, 'ProcReturnCode'),
    mdStatus: pickInsensitive(record, 'mdStatus'),
    oid: pickInsensitive(record, 'oid'),
    ReturnOid: pickInsensitive(record, 'ReturnOid'),
    AuthCode: pickInsensitive(record, 'AuthCode'),
    HostRefNum: pickInsensitive(record, 'HostRefNum'),
    TransId: pickInsensitive(record, 'TransId'),
    ErrMsg: pickInsensitive(record, 'ErrMsg'),
    HASH: pickInsensitive(record, 'HASH'),
    ClientIp: pickInsensitive(record, 'ClientIp'),
    MaskedPan: pickInsensitive(record, 'MaskedPan'),
    rnd: pickInsensitive(record, 'rnd') || pickInsensitive(record, 'Rnd'),
    'EXTRA.TRXDATE': pickExtraTrxDate(record),
    merchantID: pickInsensitive(record, 'merchantID') || pickInsensitive(record, 'MerchantID'),
    txstatus: pickInsensitive(record, 'txstatus') || pickInsensitive(record, 'TxStatus'),
    iReqCode: pickInsensitive(record, 'iReqCode'),
    iReqDetail: pickInsensitive(record, 'iReqDetail'),
    vendorCode: pickInsensitive(record, 'vendorCode'),
    PAResSyntaxOK: pickInsensitive(record, 'PAResSyntaxOK'),
    ParesVerified:
      pickInsensitive(record, 'ParesVerified') || pickInsensitive(record, 'paresVerified'),
    eci: pickInsensitive(record, 'eci'),
    cavv: pickInsensitive(record, 'cavv'),
    xid: pickInsensitive(record, 'xid'),
    cavvAlgorithm: pickInsensitive(record, 'cavvAlgorithm'),
    md: pickInsensitive(record, 'md'),
    Version: pickInsensitive(record, 'Version'),
    sID: pickInsensitive(record, 'sID'),
    MdErrorMsg: pickInsensitive(record, 'MdErrorMsg'),
  }
}
