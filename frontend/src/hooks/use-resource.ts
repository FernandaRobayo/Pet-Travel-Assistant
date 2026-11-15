'use client';
import {useCallback, useEffect, useState} from 'react';
import {useAuth} from '@/components/auth/auth-provider';
import {api} from '@/lib/api';

export default function useResource<T>(path: string) {
  const {token} = useAuth();
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  const reload = useCallback(()=>setAttempt(x=>x+1),[]);
  useEffect(()=>{
    let active=true;
    setLoading(true); setError(''); setData(null);
    if (!token) return;
    api<T>(path,token).then(result=>{if(active)setData(result);})
      .catch(reason=>{if(active)setError(reason instanceof Error?reason.message:'No se pudieron cargar los datos.');})
      .finally(()=>{if(active)setLoading(false);});
    return ()=>{active=false;};
  },[path,token,attempt]);
  return {data,loading,error,reload};
}
