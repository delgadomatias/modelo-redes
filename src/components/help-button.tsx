import {
  Button,
  Modal,
  ModalBody,
  ModalContent,
  ModalHeader,
  useDisclosure,
} from "@nextui-org/react";
import { Kbd } from "@nextui-org/kbd";

export const HelpButton = ({ isMaxFlow = false }: { isMaxFlow: boolean }) => {
  const { isOpen, onOpen, onOpenChange } = useDisclosure();

  return (
    <>
      <Button onPress={onOpen} className="max-w-fit" color={"primary"}>
        Ayuda
      </Button>
      <Modal
        isOpen={isOpen}
        size={"2xl"}
        placement="auto"
        onOpenChange={onOpenChange}
        backdrop={"blur"}
      >
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">Ayuda</ModalHeader>
          <ModalBody>
            <h2 className={"text-lg"}>Controles</h2>
            <ul className={"list-disc list-inside flex flex-col gap-2 pb-6"}>
              <li className={"px-4"}>Doble click para crear un nodo.</li>
              <li className={"px-4"}>
                Doble click para indicar que un nodo es un nodo de inicio o fin.
              </li>
              <li className={"px-4"}>
                <Kbd keys={"delete"}>Suprimir</Kbd> para eliminar un nodo.
              </li>
              <li className={"px-4"}>
                <Kbd keys={"shift"}>Shift + click izquierdo</Kbd> en simultáneo
                para crear una relación.
              </li>
            </ul>
            {isMaxFlow && (
              <>
                <h2 className={"text-lg"}>Relaciones</h2>
                <ul
                  className={"list-disc list-inside flex flex-col gap-2 pb-6"}
                >
                  <li className={"px-4"}>
                    Separar el valor de la relación con una barra ( / )
                  </li>
                </ul>
              </>
            )}
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
};
