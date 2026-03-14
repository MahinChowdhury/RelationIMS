import os
import re

files_to_check = [
    r'd:\WellDev\RelationIMS\Relation_IMS.React\src\pages\userprofile\UserProfile.tsx',
    r'd:\WellDev\RelationIMS\Relation_IMS.React\src\pages\orders\VariantSelectionModal.tsx',
    r'd:\WellDev\RelationIMS\Relation_IMS.React\src\pages\orders\InternalOrderCycle.tsx',
    r'd:\WellDev\RelationIMS\Relation_IMS.React\src\pages\orders\EditPaymentModal.tsx',
    r'd:\WellDev\RelationIMS\Relation_IMS.React\src\pages\inventory\InventoryLocations.tsx',
    r'd:\WellDev\RelationIMS\Relation_IMS.React\src\pages\orders\CreateOrder.tsx',
    r'd:\WellDev\RelationIMS\Relation_IMS.React\src\pages\configuration\Configuration.tsx',
    r'd:\WellDev\RelationIMS\Relation_IMS.React\src\pages\arrangement\ArrangementDetails.tsx',
    r'd:\WellDev\RelationIMS\Relation_IMS.React\src\components\ShareCatalogModal.tsx',
    r'd:\WellDev\RelationIMS\Relation_IMS.React\src\components\products\ProductModals.tsx',
    r'd:\WellDev\RelationIMS\Relation_IMS.React\src\components\products\InventoryStockModal.tsx',
    r'd:\WellDev\RelationIMS\Relation_IMS.React\src\components\customers\CustomerModals.tsx',
]

def add_portal(content):
    # Regex to find: return (\n <div className="fixed inset-0 ... z-[100]
    # And replace with: return createPortal(\n <div className="fixed inset-0 ... z-[100]
    
    # We only want to wrap the outermost <div className="fixed inset-0... we can't reliably parse HTML with regex,
    # but since our code is formatted consistently, we can look for `return (\n        <div className="fixed inset-0`
    
    # Let's count parens to find the closing );
    # For every `return (\n        <div className="fixed inset-0`
    
    offset = 0
    while True:
        match = re.search(r'return\s*\(\s*(<div[^>]*className=\"[^\"]*fixed inset-0[^\"]*z-\[100\][^\"]*\")', content[offset:])
        if not match:
            break
        
        start_idx = offset + match.start()
        
        # Find the matching closing parenthesis for `return (`
        paren_count = 0
        in_return = False
        end_idx = -1
        
        for i, char in enumerate(content[start_idx:]):
            if char == '(':
                paren_count += 1
                in_return = True
            elif char == ')':
                paren_count -= 1
                
            if in_return and paren_count == 0:
                end_idx = start_idx + i
                break
                
        if end_idx != -1:
            # We found the `return ( ... )` block
            original = content[start_idx:end_idx+1]
            # Replace `return (` with `return createPortal(`
            # Replace the final `)` with `, document.body)`
            new_block = re.sub(r'^return\s*\(', 'return createPortal(', original, count=1)
            new_block = new_block[:-1] + ', document.body)'
            
            content = content[:start_idx] + new_block + content[end_idx+1:]
            offset = start_idx + len(new_block)
        else:
            offset = start_idx + 1

    return content

for fpath in files_to_check:
    if not os.path.exists(fpath):
        continue
    with open(fpath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    new_content = add_portal(content)
    
    if new_content != content:
        if "import { createPortal }" not in new_content:
            new_content = "import { createPortal } from 'react-dom';\n" + new_content
        with open(fpath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Updated {fpath}")
