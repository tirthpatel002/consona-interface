import { definePlugin } from '../../core/plugin'
import { NavigationProvider } from './context/navigation-provider'
import { NavBreadcrumbs } from './components/nav-breadcrumbs'
import { NavLevelMenu } from './components/nav-level-menu'
import { NavOutlet } from './components/nav-outlet'
import { NavLink } from './components/nav-link'

export const NavigationPlugin = definePlugin({
  name: 'navigation',
  version: '1.1.0',
  Provider: NavigationProvider,
  components: {
    NavBreadcrumbs,
    NavLevelMenu,
    NavOutlet,
    NavLink,
  },
})
