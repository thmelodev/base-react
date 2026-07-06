import { QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router-dom'
import { AppRouter } from './AppRouter'
import { queryClient } from './queryClient'

export function AppProviders() {
	return (
		<QueryClientProvider client={queryClient}>
			<BrowserRouter>
				<AppRouter />
			</BrowserRouter>
		</QueryClientProvider>
	)
}
