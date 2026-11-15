# Explicación de tres pruebas RTL

Archivo: `frontend/src/test/behaviors.test.tsx`. Ejecutar `npm run test:front`. Resultado final: 12/12.

## Imports y mocks comunes

`React` permite JSX. Vitest aporta `beforeEach` (preparación), `describe` (grupo), `it` (caso), `expect` (assertions) y `vi` (mocks). RTL aporta `render` (montar componente real), `screen` (consultar el DOM accesible) y `waitFor` (esperar un efecto observable). `userEvent` simula acciones asíncronas, por eso se usa await.

Los componentes importados son reales. `vi.hoisted` prepara mocks antes de evaluar módulos. `vi.mock` sustituye navegación, contexto de sesión, cliente HTTP y hook de recursos; no requiere servidor. `beforeEach` limpia llamadas y restablece datos vacíos. El setup importa matchers jest-dom y ejecuta cleanup después de cada caso.

## R01 Validación del login línea por línea

1. `it('R01 ...', async()=>{` declara el caso ACC-002 asíncrono.
2. `render(<AuthForm/>)` monta login.
3. `screen.getByRole('button',{name:'Ingresar'})` encuentra el botón semánticamente.
4. `await userEvent.click(...)` envía campos vacíos.
5. `expect(screen.getByText('Ingresa un correo válido.')).toBeInTheDocument()` comprueba el mensaje visible.
6. `expect(mocks.login).not.toHaveBeenCalled()` confirma que no se envían entradas inválidas al servicio simulado.

## R07 Error y reintento línea por línea

1. `mocks.resource.error='Sin conexión'` prepara la consulta fallida.
2. `render(<MascotasScreen/>)` monta la pantalla real.
3. `screen.getByRole('alert')` selecciona el mensaje accesible; `toHaveTextContent('Sin conexión')` comprueba su contenido.
4. `screen.getByRole('button',{name:'Reintentar'})` encuentra la acción.
5. `await userEvent.click(...)` la ejecuta.
6. `expect(mocks.resource.reload).toHaveBeenCalledOnce()` verifica el efecto sin inspeccionar estado interno de React.

## R10 Documento sin vencimiento línea por línea

1. `mocks.api.mockResolvedValue({})` prepara respuesta exitosa simulada.
2. `render(<DocumentoForm mascotaId="p1" onSuccess={vi.fn()}/>)` monta el formulario con mascota y callback controlados.
3. `screen.getByLabelText('Identificación del documento')` usa el label; `await userEvent.type(...,'Carné')` introduce el texto.
4. `await userEvent.selectOptions(screen.getByLabelText('Vigencia'),'sin_vencimiento')` elige la modalidad.
5. `expect(screen.queryByLabelText('Fecha de vencimiento')).not.toBeInTheDocument()` comprueba ausencia; queryBy permite comprobar que no existe sin lanzar antes de expect.
6. `await userEvent.click(screen.getByRole('button',{name:'Guardar documento'}))` envía el formulario.
7. `await waitFor(()=>expect(mocks.api).toHaveBeenCalled())` espera el efecto sin pausas fijas.
8. `JSON.parse(mocks.api.mock.calls[0][2].body)` obtiene el payload simulado; `toEqual(...)` confirma identificación y modalidad sin fecha incompatible.

Las otras nueve pruebas cubren credencial incorrecta, registro exitoso, carga, vacío, datos/navegación, validación de tarea, botón deshabilitado/éxito, campos documentales requeridos y seguimiento vacío con aviso.
