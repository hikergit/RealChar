import { Button, Input } from '@nextui-org/react';
import { useState } from 'react';
import { TbTrash, TbEdit, TbCheck, TbX } from 'react-icons/tb';
import { useAppStore } from '@/zustand/store';

export default function ActionsList() {
  const { formData, setFormData } = useAppStore();
  const [newAction, setNewAction] = useState('');
  const [inputError, setInputError] = useState('');
  const [editIndex, setEditIndex] = useState(-1);
  const [editValue, setEditValue] = useState('');

  const handleAddAction = () => {
    if (!newAction.trim()) {
      setInputError('Action cannot be empty');
      return;
    }

    const updatedActions = [...(formData.actions || []), newAction.trim()];
    setFormData({ actions: updatedActions });
    setNewAction('');
    setInputError('');
  };

  const handleEditAction = (index) => {
    setEditIndex(index);
    setEditValue(formData.actions[index]);
  };

  const handleSaveEdit = () => {
    if (!editValue.trim()) {
      return;
    }

    const updatedActions = [...formData.actions];
    updatedActions[editIndex] = editValue.trim();
    setFormData({ actions: updatedActions });
    setEditIndex(-1);
    setEditValue('');
  };

  const handleCancelEdit = () => {
    setEditIndex(-1);
    setEditValue('');
  };

  const handleDeleteAction = (index) => {
    const updatedActions = formData.actions.filter((_, i) => i !== index);
    setFormData({ actions: updatedActions });
  };

  const handleKeyDown = (e, isEdit = false) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (isEdit) {
        handleSaveEdit();
      } else {
        handleAddAction();
      }
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <h4 className="font-medium text-lg">Available Actions</h4>
      <p className="text-small">
        Add actions that your character can perform (e.g., "Searching the web", "Creating art", "Analyzing data")
      </p>
      
      <div className="flex gap-2">
        <Input
          placeholder="Add a new action"
          value={newAction}
          onChange={(e) => {
            setNewAction(e.target.value);
            if (e.target.value.trim()) {
              setInputError('');
            }
          }}
          onKeyDown={(e) => handleKeyDown(e)}
          isInvalid={!!inputError}
          errorMessage={inputError}
          classNames={{
            inputWrapper: [
              'bg-white/10',
              'data-[hover=true]:bg-white/10',
              'group-data-[focus=true]:bg-white/10'
            ],
          }}
        />
        <Button 
          onPress={handleAddAction}
          className="bg-real-contrastBlue"
        >
          Add
        </Button>
      </div>

      <div className="flex flex-col gap-2 mt-2">
        {formData.actions && formData.actions.length > 0 ? (
          formData.actions.map((action, index) => (
            <div key={index} className="flex items-center gap-2 bg-white/5 rounded-md p-2">
              {editIndex === index ? (
                <>
                  <Input
                    autoFocus
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onKeyDown={(e) => handleKeyDown(e, true)}
                    className="flex-grow"
                    classNames={{
                      inputWrapper: [
                        'bg-white/10',
                        'data-[hover=true]:bg-white/10',
                        'group-data-[focus=true]:bg-white/10'
                      ],
                    }}
                  />
                  <Button
                    isIconOnly
                    size="sm"
                    variant="light"
                    onPress={handleSaveEdit}
                    className="text-success"
                  >
                    <TbCheck size="1.4em" />
                  </Button>
                  <Button
                    isIconOnly
                    size="sm"
                    variant="light"
                    onPress={handleCancelEdit}
                    className="text-danger"
                  >
                    <TbX size="1.4em" />
                  </Button>
                </>
              ) : (
                <>
                  <span className="flex-grow">{action}</span>
                  <Button
                    isIconOnly
                    size="sm"
                    variant="light"
                    onPress={() => handleEditAction(index)}
                  >
                    <TbEdit size="1.4em" />
                  </Button>
                  <Button
                    isIconOnly
                    size="sm"
                    variant="light"
                    onPress={() => handleDeleteAction(index)}
                    className="text-danger"
                  >
                    <TbTrash size="1.4em" />
                  </Button>
                </>
              )}
            </div>
          ))
        ) : (
          <p className="text-small text-gray-400 italic">No actions added yet</p>
        )}
      </div>
    </div>
  );
}