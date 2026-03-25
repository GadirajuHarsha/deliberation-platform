import yaml
import codecs

with codecs.open('service.yaml', 'r', encoding='utf-16le') as f:
    doc = yaml.safe_load(f)

# Add gen2 execution environment
if 'spec' in doc and 'template' in doc['spec']:
    if 'metadata' not in doc['spec']['template']:
        doc['spec']['template']['metadata'] = {}
    if 'annotations' not in doc['spec']['template']['metadata']:
        doc['spec']['template']['metadata']['annotations'] = {}
    doc['spec']['template']['metadata']['annotations']['run.googleapis.com/execution-environment'] = 'gen2'

    container = doc['spec']['template']['spec']['containers'][0]

    # Add ENV
    if 'env' not in container:
        container['env'] = []
    # remove DB_DIR if exists
    container['env'] = [e for e in container['env'] if e.get('name') != 'DB_DIR']
    container['env'].append({'name': 'DB_DIR', 'value': '/mnt/clarity-db'})

    # Add volume mount
    if 'volumeMounts' not in container:
        container['volumeMounts'] = []
    # Remove db-vol if exists
    container['volumeMounts'] = [vm for vm in container['volumeMounts'] if vm.get('name') != 'db-vol']
    container['volumeMounts'].append({
        'name': 'db-vol',
        'mountPath': '/mnt/clarity-db'
    })

    # Add volume definition
    if 'volumes' not in doc['spec']['template']['spec']:
        doc['spec']['template']['spec']['volumes'] = []
    # Remove db-vol if exists
    doc['spec']['template']['spec']['volumes'] = [v for v in doc['spec']['template']['spec']['volumes'] if v.get('name') != 'db-vol']
    doc['spec']['template']['spec']['volumes'].append({
        'name': 'db-vol',
        'csi': {
            'driver': 'gcsfuse.run.googleapis.com',
            'volumeAttributes': {
                'bucketName': 'clarity-db-project-0582302d'
            }
        }
    })

with open('service_updated.yaml', 'w', encoding='utf-8') as f:
    yaml.dump(doc, f, default_flow_style=False)
