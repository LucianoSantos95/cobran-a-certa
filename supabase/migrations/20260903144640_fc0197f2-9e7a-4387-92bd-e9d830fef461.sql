DROP POLICY "clientes_owner" ON public.clientes;
DROP POLICY "cobrancas_owner" ON public.cobrancas;
DROP POLICY "envios_owner" ON public.envios;
DROP FUNCTION public.is_allowed_user();

CREATE POLICY "clientes_owner" ON public.clientes FOR ALL TO authenticated
  USING (auth.uid() = user_id AND lower(coalesce(auth.jwt() ->> 'email','')) = 'oluciano.dosantos@gmail.com')
  WITH CHECK (auth.uid() = user_id AND lower(coalesce(auth.jwt() ->> 'email','')) = 'oluciano.dosantos@gmail.com');

CREATE POLICY "cobrancas_owner" ON public.cobrancas FOR ALL TO authenticated
  USING (auth.uid() = user_id AND lower(coalesce(auth.jwt() ->> 'email','')) = 'oluciano.dosantos@gmail.com')
  WITH CHECK (auth.uid() = user_id AND lower(coalesce(auth.jwt() ->> 'email','')) = 'oluciano.dosantos@gmail.com');

CREATE POLICY "envios_owner" ON public.envios FOR ALL TO authenticated
  USING (auth.uid() = user_id AND lower(coalesce(auth.jwt() ->> 'email','')) = 'oluciano.dosantos@gmail.com')
  WITH CHECK (auth.uid() = user_id AND lower(coalesce(auth.jwt() ->> 'email','')) = 'oluciano.dosantos@gmail.com');