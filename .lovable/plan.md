# Topology page: walkthrough and upgrades

## What's weak today
- The map is static: lines move, but nothing actually travels between clients, hub and nodes.
- Nodes are a flat list. Your document groups workspaces by host machine (virt-host-01/02/03), and the map doesn't show that.
- The Hub is a single box. Its parts (orchestration, policy, credentials, model gateway, bridge) can't be inspected.
- Only nodes can be selected. Clients and the Hub can't, so the side panel is half-useful.
- No way to filter, search or focus. With more nodes it would become cluttered.
- Pause / Resume / Recycle buttons do nothing, not even visually.
- On smaller screens (your current preview is about 820px wide) the map squeezes and cards overlap.

## Improvements
1. **Live traffic on the lines**: small glowing dots travel from client to Hub to node (tasks going out) and back (results), coloured by type: task, review or maintenance.
2. **Host grouping**: nodes sit inside shaded "host" zones labelled with the machine name and its load. The warm pool shows as empty slots ready to start.
3. **Inference lane**: a GPU/model strip below the Hub (Open models, Cloud models), with Cloud shown greyed out or locked when policy blocks it. This makes the air-gapped rule visible.
4. **Everything is selectable**: clicking a client, the Hub, any Hub part or a node opens a matching detail panel (sessions, policy summary, recent activity, mini CPU/memory sparkline). Hovering highlights the full path from that item.
5. **Toolbar**: search box, status filters (busy / paused / idle / error), a "show traffic" toggle and a "focus selected" mode that dims everything not connected to it.
6. **Working node actions (UI only)**: Pause, Resume and Recycle change the node's status, line and colour, with a toast confirmation and a short "transitioning" animation.
7. **Live metrics**: CPU, memory and status gently change over time. A small activity ticker under the map shows events like "node-c2 resumed".
8. **Health summary bar**: the stat tiles become a richer strip (latency, tasks/hour, policy denials), each with a tiny trend line.
9. **Small screens**: below roughly 1100px the map switches to a stacked layout (clients, then Hub, then hosts), and the detail panel becomes a slide-in drawer.

## Technical details
- Split `src/routes/index.tsx` into components under `src/components/topology/`: TopologyCanvas, HubCard, HostZone, NodeCard, ClientCard, DetailPanel, Toolbar, TrafficLayer.
- Add hosts, hub sub-components and activity templates to `src/lib/mock.ts`. Keep it the single swap-in point for your backend.
- Traffic dots use SVG `animateMotion` along the existing curve paths. Live changes run in `useEffect` intervals so the page renders the same on the server and in the browser.
- Use sonner for toasts and the shadcn Sheet for the mobile drawer.
- No backend work.
