// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity ^0.8.6;

import "forge-std/Test.sol";
import {ERC1967Proxy} from "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import {UUPSUpgradeable} from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "../../src/SafeModuleManager.sol";
import "../../src/ManagedSafeModule.sol";
import "../../src/SyncGroupRegistry.sol";

/**
 * @title UpgradeHelper
 * @notice Helper contract for testing UUPS upgrades
 */
contract UpgradeHelper is Test {

    /**
     * @notice Upgrade a UUPS proxy to a new implementation
     * @param proxy Address of the proxy contract
     * @param newImplementation Address of the new implementation
     * @param caller Address that will call the upgrade function
     */
    function upgradeProxy(
        address proxy,
        address newImplementation,
        address caller
    ) internal {
        vm.prank(caller);
        UUPSUpgradeable(proxy).upgradeTo(newImplementation);
    }

    /**
     * @notice Upgrade a UUPS proxy and call a function atomically
     * @param proxy Address of the proxy contract
     * @param newImplementation Address of the new implementation
     * @param caller Address that will call the upgrade function
     * @param data Encoded function call to execute after upgrade
     */
    function upgradeProxyAndCall(
        address proxy,
        address newImplementation,
        address caller,
        bytes memory data
    ) internal {
        vm.prank(caller);
        UUPSUpgradeable(proxy).upgradeToAndCall(newImplementation, data);
    }

    /**
     * @notice Get the implementation address from a proxy
     * @param proxy Address of the proxy contract
     * @return impl Address of the current implementation
     */
    function getImplementation(address proxy) internal view returns (address impl) {
        // ERC1967 implementation slot
        bytes32 slot = 0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc;
        impl = address(uint160(uint256(vm.load(proxy, slot))));
    }

    /**
     * @notice Verify that a proxy upgrade was successful
     * @param proxy Address of the proxy contract
     * @param expectedImplementation Expected new implementation address
     */
    function assertUpgradeSuccessful(
        address proxy,
        address expectedImplementation
    ) internal {
        address actualImpl = getImplementation(proxy);
        assertEq(actualImpl, expectedImplementation, "Upgrade failed: implementation mismatch");
    }

    /**
     * @notice Verify contract version after upgrade
     * @param contractAddress Address of the contract to check
     * @param expectedVersion Expected version string
     */
    function assertVersion(address contractAddress, string memory expectedVersion) internal {
        // Try SafeModuleManager
        try SafeModuleManager(contractAddress).getVersion() returns (string memory version) {
            assertEq(version, expectedVersion, "Version mismatch");
            return;
        } catch {}

        // Try ManagedSafeModule
        try ManagedSafeModule(payable(contractAddress)).getVersion() returns (string memory version) {
            assertEq(version, expectedVersion, "Version mismatch");
            return;
        } catch {}

        // Try SyncGroupRegistry (uses VERSION constant, not getVersion())
        try SyncGroupRegistry(payable(contractAddress)).VERSION() returns (string memory version) {
            assertEq(version, expectedVersion, "Version mismatch");
            return;
        } catch {}

        revert("Contract does not have getVersion() or VERSION");
    }

    /**
     * @notice Deploy a new SafeModuleManager implementation
     * @return impl Address of the new implementation
     */
    function deployNewManagerImplementation() internal returns (SafeModuleManager impl) {
        impl = new SafeModuleManager();
    }

    /**
     * @notice Deploy a new ManagedSafeModule implementation
     * @return impl Address of the new implementation
     */
    function deployNewModuleImplementation() internal returns (ManagedSafeModule impl) {
        impl = new ManagedSafeModule();
    }

    /**
     * @notice Deploy a new SyncGroupRegistry implementation
     * @return impl Address of the new implementation
     */
    function deployNewRegistryImplementation() internal returns (SyncGroupRegistry impl) {
        impl = new SyncGroupRegistry();
    }

    /**
     * @notice Upgrade SafeModuleManager proxy
     * @param managerProxy Address of the manager proxy
     * @param owner Address of the manager owner (authorized to upgrade)
     * @return newImpl Address of the new implementation
     */
    function upgradeManager(
        address managerProxy,
        address owner
    ) internal returns (address newImpl) {
        SafeModuleManager newImplementation = deployNewManagerImplementation();
        upgradeProxy(managerProxy, address(newImplementation), owner);
        assertUpgradeSuccessful(managerProxy, address(newImplementation));
        return address(newImplementation);
    }

    /**
     * @notice Upgrade ManagedSafeModule instance
     * @param moduleProxy Address of the module proxy
     * @param owner Address of the module owner (authorized to upgrade)
     * @return newImpl Address of the new implementation
     */
    function upgradeModule(
        address moduleProxy,
        address owner
    ) internal returns (address newImpl) {
        ManagedSafeModule newImplementation = deployNewModuleImplementation();
        upgradeProxy(moduleProxy, address(newImplementation), owner);
        assertUpgradeSuccessful(moduleProxy, address(newImplementation));
        return address(newImplementation);
    }

    /**
     * @notice Upgrade SyncGroupRegistry proxy
     * @param registryProxy Address of the registry proxy
     * @param owner Address of the registry owner (authorized to upgrade)
     * @return newImpl Address of the new implementation
     */
    function upgradeRegistry(
        address registryProxy,
        address owner
    ) internal returns (address newImpl) {
        SyncGroupRegistry newImplementation = deployNewRegistryImplementation();
        upgradeProxy(registryProxy, address(newImplementation), owner);
        assertUpgradeSuccessful(registryProxy, address(newImplementation));
        return address(newImplementation);
    }

    /**
     * @notice Update module template in manager and verify
     * @param manager SafeModuleManager instance
     * @param owner Manager owner address
     * @return newTemplate Address of the new module template
     */
    function updateModuleTemplate(
        SafeModuleManager manager,
        address owner
    ) internal returns (address newTemplate) {
        ManagedSafeModule template = deployNewModuleImplementation();
        vm.prank(owner);
        manager.updateModuleTemplate(template);
        assertEq(address(manager.moduleTemplate()), address(template), "Template update failed");
        return address(template);
    }

    /**
     * @notice Perform full system upgrade (Manager + Registry + Module Template)
     * @param managerProxy SafeModuleManager proxy address
     * @param registryProxy SyncGroupRegistry proxy address
     * @param managerOwner Manager owner address
     * @param registryOwner Registry owner address
     */
    function upgradeFullSystem(
        address managerProxy,
        address registryProxy,
        address managerOwner,
        address registryOwner
    ) internal returns (
        address newManagerImpl,
        address newRegistryImpl,
        address newModuleTemplate
    ) {
        // Upgrade Manager
        newManagerImpl = upgradeManager(managerProxy, managerOwner);

        // Upgrade Registry
        newRegistryImpl = upgradeRegistry(registryProxy, registryOwner);

        // Update Module Template in Manager
        newModuleTemplate = updateModuleTemplate(
            SafeModuleManager(managerProxy),
            managerOwner
        );
    }

    /**
     * @notice Snapshot contract state for comparison
     * @param manager SafeModuleManager instance
     * @return moduleCount Number of modules managed
     * @return modules Array of all module addresses
     */
    function snapshotManagerState(SafeModuleManager manager)
        internal
        view
        returns (
            uint256 moduleCount,
            address[] memory modules
        )
    {
        moduleCount = manager.getModuleCount();
        modules = manager.getAllModules();
    }

    /**
     * @notice Snapshot registry state for comparison
     * @param registry SyncGroupRegistry instance
     * @return nextGroupId Next available group ID
     */
    function snapshotRegistryState(SyncGroupRegistry registry)
        internal
        view
        returns (uint256 nextGroupId)
    {
        nextGroupId = registry.nextGroupId();
    }

    /**
     * @notice Assert that manager state was preserved after upgrade
     */
    function assertManagerStatePreserved(
        SafeModuleManager manager,
        uint256 expectedModuleCount,
        address[] memory expectedModules
    ) internal {
        assertEq(manager.getModuleCount(), expectedModuleCount, "Module count changed");

        address[] memory actualModules = manager.getAllModules();
        assertEq(actualModules.length, expectedModules.length, "Modules array length changed");

        for (uint256 i = 0; i < expectedModules.length; i++) {
            assertEq(actualModules[i], expectedModules[i], "Module address mismatch");
        }
    }

    /**
     * @notice Assert that registry state was preserved after upgrade
     */
    function assertRegistryStatePreserved(
        SyncGroupRegistry registry,
        uint256 expectedNextGroupId
    ) internal {
        assertEq(registry.nextGroupId(), expectedNextGroupId, "Next group ID changed");
    }
}
