import request from './request'

export const getMyVerificationApi = () => {
  return request.get('/api/my/verification')
}

export const submitVerificationApi = data => {
  return request.post('/api/verifications', {
    level: data.level,
    real_name: data.realName,
    student_no: data.studentNo,
    phone: data.phone,
    id_card_last4: data.idCardLast4 || ''
  })
}