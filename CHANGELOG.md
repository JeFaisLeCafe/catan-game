# Changelog

All notable changes to this project will be documented in this file.

## [0.3.0] - 2025-10-29

### Added
- **AI Bot Support for Robber Phase**: New APIs for handling the special turn management during `robberDiscard` phase
  - `game.getPlayersWhoMustDiscard(): string[]` - Get list of players who must discard resources
  - `game.doesPlayerNeedToAct(playerId: string): boolean` - Check if a player needs to act in current phase
- Comprehensive test suite for robber discard phase with 9 new tests
- Enhanced CLI display showing which players must discard during robber phase
- Documentation for robber phase turn management patterns

### Fixed
- **Critical**: Robber discard phase no longer cycles through all players - only players in `mustDiscardPlayers` can act
- `endTurn()` now properly validates and prevents being called during `robberDiscard` and `robberPlacement` phases
- CLI robber discard handler now prompts each player individually to choose which resources to discard
- CLI robber placement offers list of valid hexes with opponent information
- Fixed linter error in test helper files

### Changed
- CLI robber handlers refactored for better user experience
- Test helpers updated to use new robber phase APIs

## [0.2.0] - 2025-10-29

### Added
- Complete event logging system with `GameLogger` class
- Game statistics calculation with `calculateStatistics()` utility
- Event types for all game actions (dice rolls, building, trading, robber, etc.)
- Event subscription system for real-time notifications
- Game export functionality with `game.exportGame()`
- Comprehensive integration test simulating full games

### Changed
- Game class now includes logger and provides `getHistory()` and `getStatistics()` methods
- Package structure optimized for npm distribution
- Added `.npmignore` and proper `files` configuration
- Updated README with usage examples and API documentation

## [0.1.0] - 2025-10-29

### Added
- Complete Catan game engine implementation
- Setup phase with proper placement rules
- Main game phase with dice rolling, building, and trading
- Development cards system (Knights, Road Building, Year of Plenty, Monopoly, Victory Points)
- Robber mechanics with discard and placement
- Victory conditions (10 points, Longest Road, Largest Army)
- CLI interface for playing games
- Hexagonal board generation with proper adjacency
- Resource distribution based on dice rolls
- Comprehensive test suite

### Technical
- Built with TypeScript in strict mode
- XState for game state management
- Clean Architecture principles
- Modular codebase with separation of concerns
- Full type safety throughout

