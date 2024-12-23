import { useAppDispatch } from '../../app/hooks'
import { api } from '../utils'
import { useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { logIn } from './loginSlice'
import { useTranslation } from 'react-i18next'

export const LoginCallback = () => {
  const [searchParamas, _setParams] = useSearchParams()
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const { t } = useTranslation()
  useEffect(() => {
    api
      .get(`/login/google/callback?${searchParamas.toString()}`)
      .then((res) => dispatch(logIn(res.data.username)))
      .finally(() => navigate('/admin')) // Admin redirects automatically to index if not logged in
  }, [])
  return (
    <>
      <h2>{t('login.logging_in')}</h2>
    </>
  )
}
