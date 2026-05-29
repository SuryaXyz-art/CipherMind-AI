// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
 * @title MockUSDC
 * @notice Test-only stablecoin for the CipherMind encrypted vault. Uses 0
 *         decimals so 1 token == $1, keeping amounts within euint32 range for
 *         the FHE balance accounting. Anyone can mint from the faucet.
 */
contract MockUSDC is ERC20 {
    constructor() ERC20("Mock USDC", "mUSDC") {}

    function decimals() public pure override returns (uint8) {
        return 0;
    }

    /// @notice Mint test tokens to the caller (testnet faucet).
    function faucet(uint256 amount) external {
        _mint(msg.sender, amount);
    }
}
