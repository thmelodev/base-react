import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { AppProviders } from './app/providers'
import './app/styles/index.css'

// biome-ignore lint/style/noNonNullAssertion: index.html always renders <div id="root">
createRoot(document.getElementById('root')!).render(
	<StrictMode>
		<AppProviders />
	</StrictMode>,
)
