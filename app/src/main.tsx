import React from 'react'
import ReactDOM from 'react-dom/client'
import {
  InterfaceProvider,
  NavigationPlugin,
  OnboardingPlugin,
  OverlayPlugin,
  SoundPlugin,
  BrowserHistoryAdapter,
  Toast,
  consonaThemeExtender,
} from '@consona/interface'
import { TypeInspectorProvider } from './components/type-inspector-modal'
import { buildNavTree } from './navigation'
import { App } from './app'
import './index.css'

const navTree = buildNavTree()
const browserAdapter = new BrowserHistoryAdapter()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <InterfaceProvider
      theme={{ defaultTheme: 'dark', extenders: [consonaThemeExtender] }}
      plugins={[
        { ...NavigationPlugin, options: { tree: navTree, adapter: browserAdapter } },
        OnboardingPlugin,
        OverlayPlugin,
        SoundPlugin,
        { name: 'type-inspector', Provider: TypeInspectorProvider },
      ]}
    >
      <App />
      <Toast position="bottom-right" />
    </InterfaceProvider>
  </React.StrictMode>
)
