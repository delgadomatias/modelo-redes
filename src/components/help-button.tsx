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
      <Button onPress={onOpen} className="max-w-fit" color={"secondary"}>
        Ayuda
      </Button>
      <Modal
        isOpen={isOpen}
        size={"3xl"}
        placement="auto"
        onOpenChange={onOpenChange}
        backdrop={"blur"}
      >
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">Ayuda</ModalHeader>
          <ModalBody>
            <h2 className={"text-lg"}>Controles</h2>
            <ul className={"list-disc list-inside flex flex-col gap-2 pb-2"}>
              <li className={"px-4"}>Doble click para crear un nodo.</li>
              <li className={"px-4"}>
                Doble click sobre un nodo para indicar que el mismo es de inicio
                o fin.
              </li>
              <li className={"px-4"}>
                Seleccionar el nodo con un click y presionar la tecla{" "}
                <Kbd>Suprimir</Kbd> para eliminarlo.
              </li>
              <li className={"px-4"}>
                <Kbd>Shift</Kbd> + click izquierdo en simultáneo para crear una
                relación entre dos nodos.
              </li>
            </ul>
            <h2 className={"text-lg"}>Visualización</h2>
            <ul
              className={`list-disc list-inside flex flex-col gap-2 ${!isMaxFlow ? "pb-6" : "pb-2"}`}
            >
              <li className={"px-4"}>
                Un nodo de color <span className={"text-blue-700"}>azul</span>{" "}
                representa un nodo de inicio.
              </li>
              <li className={"px-4"}>
                Un nodo de color <span className={"text-green-700"}>verde</span>{" "}
                representa un nodo de fin.
              </li>
            </ul>

            {isMaxFlow && (
              <>
                <h2 className={"text-lg"}>Relaciones</h2>
                <ul
                  className={"list-disc list-inside flex flex-col gap-2 pb-6"}
                >
                  <li className={"px-4"}>
                    Al momento de ingresar el valor de una relación ingresar una
                    barra vertical <Kbd>/</Kbd> para separar los valores de los
                    flujos.
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
